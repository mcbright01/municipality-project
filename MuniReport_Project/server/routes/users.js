// server/routes/users.js
const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { hashPassword } = require('../utils/crypto');
const { isValidEmail } = require('../utils/validate');

const router = express.Router();
router.use(requireAuth);

const VALID_ROLES = ['Admin', 'Citizen', 'Municipal Officer', 'Field Inspector', 'Supervisor', 'Data Analyst'];

// --- Admin: view all user accounts (FR7) ---
router.get('/', requireRole('Admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load users.' });
  }
});

// --- Admin: create a staff account directly with any role (fixes the
// "only Citizen" limitation of the public sign-up form). Generates a
// random one-time password and returns it once — the Admin passes it to
// the staff member out of band (in person, over the phone, etc.), and
// they should change it after first login.
router.post('/', requireRole('Admin'), async (req, res) => {
  try {
    const { fullName, email, role } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({ message: 'Full name, email, and role are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const tempPassword = crypto.randomBytes(9).toString('base64url'); // 12-char one-time password
    const passwordHash = hashPassword(tempPassword);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email, role, is_active`,
      [fullName, email.toLowerCase(), passwordHash, role]
    );

    const user = result.rows[0];
    await logAction(req.user.id, 'CREATE_STAFF_USER', 'users', user.user_id, `role:${role}`);

    // The one-time password is only ever returned here, never stored in
    // plain text, and never logged.
    res.status(201).json({ ...user, temporaryPassword: tempPassword });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not create user.' });
  }
});

// --- Supervisor / Admin: list active Field Inspectors, for assignment dropdowns ---
router.get('/inspectors', requireRole('Supervisor', 'Admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name FROM users WHERE role = 'Field Inspector' AND is_active = true ORDER BY full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load inspectors.' });
  }
});

// --- Admin: activate/deactivate a user or change their role (FR7) ---
router.patch('/:id', requireRole('Admin'), async (req, res) => {
  try {
    const { is_active, role } = req.body;

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const result = await pool.query(
      `UPDATE users SET
         is_active = COALESCE($1, is_active),
         role = COALESCE($2, role)
       WHERE user_id = $3
       RETURNING user_id, full_name, email, role, is_active`,
      [typeof is_active === 'boolean' ? is_active : null, role || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    await logAction(req.user.id, 'UPDATE_USER', 'users', req.params.id, JSON.stringify(req.body));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not update user.' });
  }
});

// --- Admin: delete a user account (FR7) ---
router.delete('/:id', requireRole('Admin'), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    await logAction(req.user.id, 'DELETE_USER', 'users', req.params.id, null);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err.message);
    // Foreign-key constraints (e.g. a citizen with complaints on file) block deletion.
    res.status(409).json({ message: 'Could not delete user — they may have linked records. Deactivate instead.' });
  }
});

module.exports = router;
