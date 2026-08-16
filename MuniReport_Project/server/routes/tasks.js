const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

const router = express.Router();
router.use(requireAuth);

// Create a task tied to a complaint (Supervisor / Municipal Officer / Admin)
router.post('/', requireRole('Supervisor', 'Municipal Officer', 'Admin'), async (req, res) => {
  try {
    const { complaint_id, assigned_to, notes } = req.body;
    if (!complaint_id || !assigned_to) return res.status(400).json({ message: 'complaint_id and assigned_to are required.' });

    const result = await pool.query(
      `INSERT INTO tasks (complaint_id, assigned_to, assigned_by, notes)
       VALUES ($1, $2, $3, $4) RETURNING task_id, complaint_id, assigned_to, assigned_by, status, notes, created_at`,
      [complaint_id, assigned_to, req.user.id, notes || null]
    );

    const task = result.rows[0];
    await logAction(req.user.id, 'CREATE_TASK', 'tasks', task.task_id, JSON.stringify(task));
    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not create task.' });
  }
});

// List tasks. Admins and supervisors see all; users see tasks assigned to them.
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'Admin' || req.user.role === 'Supervisor') {
      const result = await pool.query(
        `SELECT t.*, u.full_name AS assigned_to_name, b.full_name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users u ON u.user_id = t.assigned_to
         LEFT JOIN users b ON b.user_id = t.assigned_by
         ORDER BY t.created_at DESC`
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      `SELECT t.*, u.full_name AS assigned_to_name, b.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u ON u.user_id = t.assigned_to
       LEFT JOIN users b ON b.user_id = t.assigned_by
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not load tasks.' });
  }
});

// Update a task (status, assigned_to, notes) — guarded to allow only creators, supervisors, or admins
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, assigned_to, notes } = req.body;

    // Only allow valid status values
    const allowed = ['Open', 'In Progress', 'Blocked', 'Done', 'Cancelled'];
    if (status && !allowed.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });

    // Check ownership or elevated role
    const taskRes = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [req.params.id]);
    if (taskRes.rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
    const task = taskRes.rows[0];

    const canModify = req.user.role === 'Admin' || req.user.role === 'Supervisor' || req.user.id === task.assigned_by || req.user.id === task.assigned_to;
    if (!canModify) return res.status(403).json({ message: 'Not authorized to modify this task.' });

    const result = await pool.query(
      `UPDATE tasks SET
         status = COALESCE($1, status),
         assigned_to = COALESCE($2, assigned_to),
         notes = COALESCE($3, notes),
         updated_at = NOW()
       WHERE task_id = $4 RETURNING *`,
      [status || null, assigned_to || null, notes || null, req.params.id]
    );

    await logAction(req.user.id, 'UPDATE_TASK', 'tasks', req.params.id, JSON.stringify(req.body));
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not update task.' });
  }
});

// Delete a task (Supervisor / Admin)
router.delete('/:id', requireRole('Supervisor', 'Admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tasks WHERE task_id = $1 RETURNING task_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
    await logAction(req.user.id, 'DELETE_TASK', 'tasks', req.params.id, null);
    res.json({ message: 'Task removed.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Could not delete task.' });
  }
});

module.exports = router;
