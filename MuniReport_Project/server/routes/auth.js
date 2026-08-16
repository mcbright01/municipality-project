// server/routes/auth.js
const express = require('express');
const pool = require('../db');
const { hashPassword, verifyPassword, createSessionToken } = require('../utils/crypto');
const { logAction } = require('../utils/audit');
const { isValidEmail, passwordPolicyError } = require('../utils/validate');
const { checkLocked, recordFailure, recordSuccess, rateLimit } = require('../utils/rateLimit');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Roles a person can self-register as through the public sign-up form.
// The other 5 roles (Admin, Municipal Officer, Field Inspector, Supervisor,
// Data Analyst) are municipal staff accounts — an Admin creates those
// directly via POST /api/users (see routes/users.js) with a role already
// chosen. Letting anyone sign up as "Admin" from the public form would be
// a serious access-control hole.
const PUBLIC_SIGNUP_ROLES = ['Citizen'];

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

// Auth endpoints are prime brute-force targets, so they get their own
// tighter global limiter on top of the per-account lockout below.
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 15 });

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { fullName, email, password, role, city, province, postalAddress, municipality } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    const passwordError = passwordPolicyError(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const requestedRole = role && PUBLIC_SIGNUP_ROLES.includes(role) ? role : 'Citizen';

    // Address details identify which municipality a citizen falls under,
    // so they're required for every Citizen sign-up. Staff accounts (which
    // never come through this public form anyway) don't need them.
    if (requestedRole === 'Citizen') {
      if (!city || !province || !postalAddress || !municipality) {
        return res.status(400).json({ message: 'City, province, postal address, and municipality are all required.' });
      }
      if (!SA_PROVINCES.includes(province)) {
        return res.status(400).json({ message: 'Please select a valid province.' });
      }
    }

    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, city, province, postal_address, municipality)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, full_name, email, role`,
      [
        fullName,
        email.toLowerCase(),
        passwordHash,
        requestedRole,
        requestedRole === 'Citizen' ? city : null,
        requestedRole === 'Citizen' ? province : null,
        requestedRole === 'Citizen' ? postalAddress : null,
        requestedRole === 'Citizen' ? municipality : null,
      ]
    );

    const user = result.rows[0];
    await logAction(user.user_id, 'REGISTER', 'users', user.user_id, `New ${requestedRole} account created`);

    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Per-account lockout: blocks repeated guessing against one email,
    // independent of the broader per-IP rate limit above.
    const lockedMessage = checkLocked(req, email);
    if (lockedMessage) {
      return res.status(429).json({ message: lockedMessage });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    // Always run verifyPassword-shaped work even when the user doesn't exist,
    // so failed logins don't reveal via timing whether an email is registered.
    const passwordOk = user ? verifyPassword(password, user.password_hash) : false;

    if (!user || !passwordOk) {
      recordFailure(req, email);
      await logAction(user ? user.user_id : null, 'FAILED_LOGIN', 'users', user ? user.user_id : null, email.toLowerCase());
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    recordSuccess(req, email);
    const token = createSessionToken(user);
    await logAction(user.user_id, 'LOGIN', 'users', user.user_id, null);

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// --- Returns the authoritative identity from the verified session token.
// The frontend calls this on every dashboard load instead of trusting the
// locally cached user object, so a tampered or stale localStorage value
// can never make the wrong dashboard render — the role always comes from
// the signed token, not from anything the browser claims. ---
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, is_active, city, province, postal_address, municipality
       FROM users WHERE user_id = $1`,
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Session no longer valid. Please log in again.' });
    }
    res.json({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      city: user.city,
      province: user.province,
      postalAddress: user.postal_address,
      municipality: user.municipality,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not verify session.' });
  }
});

// Public list of South African provinces, used to populate the registration
// form's dropdown so it always matches what the server will accept.
router.get('/provinces', (req, res) => {
  res.json(SA_PROVINCES);
});

module.exports = router;
