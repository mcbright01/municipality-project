// server/utils/audit.js
const pool = require('../db');

// Records who did what, to which record, and when — required for the
// system's audit-trail / accountability functionality (FR10).
async function logAction(userId, action, targetTable, targetId, details = null) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, target_table, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, targetTable, targetId, details]
    );
  } catch (err) {
    // Auditing must never break the primary request — just log it.
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAction };
