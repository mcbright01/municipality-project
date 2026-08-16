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
    const [byStatus, byCategory, byArea, totals] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int AS count FROM complaints GROUP BY status`),
      pool.query(
        `SELECT cat.name AS category, COUNT(*)::int AS count
         FROM complaints c JOIN categories cat ON cat.category_id = c.category_id
         GROUP BY cat.name ORDER BY count DESC`
      ),
      pool.query(
        `SELECT location_address, COUNT(*)::int AS count
         FROM complaints GROUP BY location_address ORDER BY count DESC LIMIT 5`
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM complaints) AS total_complaints,
           (SELECT COUNT(*)::int FROM complaints WHERE is_duplicate = true) AS duplicate_count,
           (SELECT COUNT(*)::int FROM users WHERE role = 'Citizen') AS total_citizens`
      ),
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

module.exports = router;
