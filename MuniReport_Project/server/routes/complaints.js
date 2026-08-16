// server/routes/complaints.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();
router.use(requireAuth);

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;

function generateReferenceNumber() {
  return `MUNI-${Math.floor(10000 + Math.random() * 90000)}`;
}

// A reusable subquery that attaches every complaint's photos as a JSON
// array, ordered the way the citizen uploaded them.
const PHOTOS_SUBQUERY = `
  COALESCE(
    (SELECT json_agg(p.photo_base64 ORDER BY p.position)
     FROM complaint_photos p
     WHERE p.complaint_id = c.complaint_id),
    '[]'
  ) AS photos
`;

// --- Citizen: submit a new complaint — requires at least 3 photos (FR2, FR8, FR9) ---
router.post('/', requireRole('Citizen'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { category_id, description, location_address, photos } = req.body;

    if (!category_id || !description || !location_address) {
      return res.status(400).json({ message: 'Category, description, and location are required.' });
    }
    if (!Array.isArray(photos) || photos.length < MIN_PHOTOS) {
      return res.status(400).json({ message: `Please attach at least ${MIN_PHOTOS} photos of the issue.` });
    }
    if (photos.length > MAX_PHOTOS) {
      return res.status(400).json({ message: `Please attach no more than ${MAX_PHOTOS} photos.` });
    }
    if (!photos.every((p) => typeof p === 'string' && p.startsWith('data:image/'))) {
      return res.status(400).json({ message: 'One or more attachments is not a valid image.' });
    }

    await client.query('BEGIN');

    // Basic duplicate detection: same category + address, reported in the
    // last 7 days and not yet resolved.
    const dupCheck = await client.query(
      `SELECT complaint_id FROM complaints
       WHERE category_id = $1 AND LOWER(location_address) = LOWER($2)
         AND status != 'Resolved' AND created_at > NOW() - INTERVAL '7 days'`,
      [category_id, location_address]
    );
    const isDuplicate = dupCheck.rows.length > 0;

    const referenceNumber = generateReferenceNumber();
    const complaintResult = await client.query(
      `INSERT INTO complaints
         (reference_number, description, location_address, citizen_id, category_id, status, is_duplicate)
       VALUES ($1, $2, $3, $4, $5, 'Pending', $6)
       RETURNING complaint_id, reference_number, status, is_duplicate, created_at`,
      [referenceNumber, description, location_address, req.user.id, category_id, isDuplicate]
    );
    const complaint = complaintResult.rows[0];

    for (let i = 0; i < photos.length; i++) {
      await client.query(
        `INSERT INTO complaint_photos (complaint_id, photo_base64, position) VALUES ($1, $2, $3)`,
        [complaint.complaint_id, photos[i], i]
      );
    }

    await client.query('COMMIT');
    await logAction(req.user.id, 'CREATE_COMPLAINT', 'complaints', complaint.complaint_id, referenceNumber);

    res.status(201).json(complaint);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ message: 'Could not save complaint.' });
  } finally {
    client.release();
  }
});

// --- Citizen: view their own complaints ---
router.get('/mine', requireRole('Citizen'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.complaint_id, c.reference_number, c.description, c.location_address, c.status,
              c.is_duplicate, c.created_at, cat.name AS category, ${PHOTOS_SUBQUERY}
       FROM complaints c
       JOIN categories cat ON cat.category_id = c.category_id
       WHERE c.citizen_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load your complaints.' });
  }
});

// --- Citizen: edit or cancel their own pending complaint ---
router.patch('/:id/cancel', requireRole('Citizen'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE complaints SET status = 'Rejected', updated_at = NOW()
       WHERE complaint_id = $1 AND citizen_id = $2 AND status = 'Pending'
       RETURNING complaint_id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found or can no longer be cancelled.' });
    }
    await logAction(req.user.id, 'CANCEL_COMPLAINT', 'complaints', req.params.id, null);
    res.json({ message: 'Complaint cancelled.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not cancel complaint.' });
  }
});

// --- Municipal Officer / Supervisor / Data Analyst / Admin: view all complaints ---
router.get('/', requireRole('Municipal Officer', 'Supervisor', 'Data Analyst', 'Admin'), async (req, res) => {
  try {
    const { status, category } = req.query;
    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`c.status = $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`cat.name = $${values.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT c.complaint_id, c.reference_number, c.description, c.location_address, c.status,
              c.is_duplicate, c.created_at, cat.name AS category,
              citizen.full_name AS citizen_name,
              inspector.full_name AS inspector_name, c.assigned_inspector_id,
              ${PHOTOS_SUBQUERY}
       FROM complaints c
       JOIN categories cat ON cat.category_id = c.category_id
       JOIN users citizen ON citizen.user_id = c.citizen_id
       LEFT JOIN users inspector ON inspector.user_id = c.assigned_inspector_id
       ${whereClause}
       ORDER BY c.created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load complaints.' });
  }
});

// --- Municipal Officer / Admin: update complaint status (FR3) ---
router.patch('/:id/status', requireRole('Municipal Officer', 'Admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    const result = await pool.query(
      `UPDATE complaints SET status = $1, updated_at = NOW() WHERE complaint_id = $2 RETURNING complaint_id`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Complaint not found.' });

    await logAction(req.user.id, 'UPDATE_STATUS', 'complaints', req.params.id, status);
    res.json({ message: `Status updated to ${status}.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not update status.' });
  }
});

// --- Municipal Officer / Admin: remove a duplicate or invalid complaint ---
router.delete('/:id', requireRole('Municipal Officer', 'Admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM complaints WHERE complaint_id = $1 RETURNING complaint_id', [
      req.params.id,
    ]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Complaint not found.' });

    await logAction(req.user.id, 'DELETE_COMPLAINT', 'complaints', req.params.id, null);
    res.json({ message: 'Complaint removed.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not delete complaint.' });
  }
});

// --- Supervisor / Admin: assign a complaint to a Field Inspector (FR5) ---
router.patch('/:id/assign', requireRole('Supervisor', 'Admin'), async (req, res) => {
  try {
    const { inspector_id } = req.body;
    if (!inspector_id) return res.status(400).json({ message: 'inspector_id is required.' });

    const inspectorCheck = await pool.query(
      `SELECT user_id FROM users WHERE user_id = $1 AND role = 'Field Inspector' AND is_active = true`,
      [inspector_id]
    );
    if (inspectorCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Selected user is not an active Field Inspector.' });
    }

    const result = await pool.query(
      `UPDATE complaints SET assigned_inspector_id = $1, status = 'Assigned', updated_at = NOW()
       WHERE complaint_id = $2 RETURNING complaint_id`,
      [inspector_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Complaint not found.' });

    await logAction(req.user.id, 'ASSIGN_INSPECTOR', 'complaints', req.params.id, `inspector:${inspector_id}`);
    res.json({ message: 'Complaint assigned to inspector.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not assign complaint.' });
  }
});

// --- Field Inspector: view complaints assigned to them (FR4) ---
router.get('/assigned', requireRole('Field Inspector'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.complaint_id, c.reference_number, c.description, c.location_address, c.status,
              c.created_at, cat.name AS category, ${PHOTOS_SUBQUERY}
       FROM complaints c
       JOIN categories cat ON cat.category_id = c.category_id
       WHERE c.assigned_inspector_id = $1 AND c.status IN ('Assigned', 'In Progress')
       ORDER BY c.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load assigned complaints.' });
  }
});

// --- Field Inspector: submit an inspection report (FR4) ---
router.post('/:id/inspection', requireRole('Field Inspector'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { findings, isFalseReport } = req.body;
    if (!findings) return res.status(400).json({ message: 'Findings are required.' });

    await client.query('BEGIN');

    const ownershipCheck = await client.query(
      `SELECT complaint_id FROM complaints WHERE complaint_id = $1 AND assigned_inspector_id = $2`,
      [req.params.id, req.user.id]
    );
    if (ownershipCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'This complaint is not assigned to you.' });
    }

    await client.query(
      `INSERT INTO inspection_reports (complaint_id, inspector_id, findings, is_false_report)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, req.user.id, findings, !!isFalseReport]
    );

    const newStatus = isFalseReport ? 'Rejected' : 'Resolved';
    await client.query(`UPDATE complaints SET status = $1, updated_at = NOW() WHERE complaint_id = $2`, [
      newStatus,
      req.params.id,
    ]);

    await client.query('COMMIT');
    await logAction(req.user.id, 'SUBMIT_INSPECTION', 'complaints', req.params.id, newStatus);

    res.status(201).json({ message: `Inspection report submitted. Complaint marked as ${newStatus}.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ message: 'Could not submit inspection report.' });
  } finally {
    client.release();
  }
});

module.exports = router;
