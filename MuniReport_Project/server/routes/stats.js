// server/routes/stats.js
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Categories are needed by every logged-in role (citizens submitting complaints,
// staff filtering by category) so this one stays open to any authenticated user.
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT category_id, name FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load categories.' });
  }
});

// --- Data Analyst / Admin: summary statistics (FR6) ---
router.get('/summary', requireAuth, requireRole('Data Analyst', 'Admin', 'Supervisor'), async (req, res) => {
  try {
    // Support optional filters: start, end (ISO dates), category, area (location_address)
    const { start, end, category, area } = req.query;
    const filters = [];
    const values = [];

    if (start) {
      values.push(start);
      filters.push(`c.created_at >= $${values.length}`);
    }
    if (end) {
      values.push(end);
      filters.push(`c.created_at <= $${values.length}`);
    }
    if (category) {
      values.push(category);
      filters.push(`cat.name = $${values.length}`);
    }
    if (area) {
      values.push(area);
      filters.push(`c.location_address = $${values.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const byStatusQ = `SELECT status, COUNT(*)::int AS count FROM complaints c JOIN categories cat ON cat.category_id = c.category_id ${where} GROUP BY status`;
    const byCategoryQ = `SELECT cat.name AS category, COUNT(*)::int AS count FROM complaints c JOIN categories cat ON cat.category_id = c.category_id ${where} GROUP BY cat.name ORDER BY count DESC`;
    const byAreaQ = `SELECT location_address, COUNT(*)::int AS count FROM complaints ${where} GROUP BY location_address ORDER BY count DESC LIMIT 5`;
    const totalsQ = `SELECT (SELECT COUNT(*)::int FROM complaints c2 ${where}) AS total_complaints, (SELECT COUNT(*)::int FROM complaints c3 ${where} AND is_duplicate = true) AS duplicate_count, (SELECT COUNT(*)::int FROM users WHERE role = 'Citizen') AS total_citizens`;

    const [byStatus, byCategory, byArea, totals] = await Promise.all([
      pool.query(byStatusQ, values),
      pool.query(byCategoryQ, values),
      pool.query(byAreaQ, values),
      pool.query(totalsQ, values),
    ]);

    res.json({
      totals: totals.rows[0],
      byStatus: byStatus.rows,
      byCategory: byCategory.rows,
      topAreas: byArea.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load statistics.' });
  }
});

// Export filtered complaints as CSV for analysts
router.get('/export', requireAuth, requireRole('Data Analyst', 'Admin', 'Supervisor'), async (req, res) => {
  try {
    const { start, end, category, area } = req.query;
    const filters = [];
    const values = [];
    if (start) { values.push(start); filters.push(`c.created_at >= $${values.length}`); }
    if (end) { values.push(end); filters.push(`c.created_at <= $${values.length}`); }
    if (category) { values.push(category); filters.push(`cat.name = $${values.length}`); }
    if (area) { values.push(area); filters.push(`c.location_address = $${values.length}`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const q = `SELECT c.complaint_id, c.reference_number, cat.name AS category, c.location_address, c.status, c.created_at FROM complaints c JOIN categories cat ON cat.category_id = c.category_id ${where} ORDER BY c.created_at DESC`;
    const result = await pool.query(q, values);

    // Simple CSV serialization
    const rows = result.rows;
    let csv = 'complaint_id,reference_number,category,location_address,status,created_at\n';
    for (const r of rows) {
      // escape commas/quotes
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      csv += `${r.complaint_id},${esc(r.reference_number)},${esc(r.category)},${esc(r.location_address)},${esc(r.status)},${esc(r.created_at)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="complaints_export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not export data.' });
  }
});

module.exports = router;
