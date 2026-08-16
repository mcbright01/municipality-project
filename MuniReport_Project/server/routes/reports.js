const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();
router.use(requireAuth);

// Resolution time report per inspector (seconds averaged). Accepts optional start/end (ISO) and inspector_id filter.
router.get('/resolution-time', requireRole('Supervisor', 'Data Analyst', 'Admin'), async (req, res) => {
  try {
    const { start, end, inspector_id } = req.query;
    const params = [];
    let where = "c.status = 'Resolved' AND c.updated_at IS NOT NULL";

    if (start) {
      params.push(start);
      where += ` AND c.updated_at >= $${params.length}`;
    }
    if (end) {
      params.push(end);
      where += ` AND c.updated_at <= $${params.length}`;
    }
    if (inspector_id) {
      params.push(inspector_id);
      where += ` AND c.assigned_inspector_id = $${params.length}`;
    }

    const q = `
      SELECT c.assigned_inspector_id AS inspector_id, u.full_name AS inspector_name,
             COUNT(*)::int AS resolved_count,
             AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)))::int AS avg_seconds,
             MIN(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)))::int AS min_seconds,
             MAX(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)))::int AS max_seconds
      FROM complaints c
      LEFT JOIN users u ON u.user_id = c.assigned_inspector_id
      WHERE ${where}
      GROUP BY c.assigned_inspector_id, u.full_name
      ORDER BY avg_seconds DESC
    `;

    const result = await pool.query(q, params);
    await logAction(req.user.id, 'VIEW_REPORT', 'reports', null, 'resolution-time');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not generate resolution time report.' });
  }
});

module.exports = router;
