// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const filesRoutes = require('./routes/files');
const statsRoutes = require('./routes/stats');


const { securityHeaders } = require('./middleware/security');

const app = express();

// Expose simple health endpoint for readiness
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '25mb' })); // up to 6 base64 complaint photos per submission

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api', statsRoutes); // exposes /api/categories and /api/summary
const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MuniReport server running on port ${PORT}`);
});
