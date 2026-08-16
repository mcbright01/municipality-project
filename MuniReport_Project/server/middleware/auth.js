// server/middleware/auth.js
const { verifySessionToken } = require('../utils/crypto');

// Verifies the Authorization: Bearer <token> header and attaches req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  const decoded = verifySessionToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }

  req.user = { id: decoded.sub, role: decoded.role, name: decoded.name };
  next();
}

// Restricts a route to specific roles. Use after requireAuth.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
