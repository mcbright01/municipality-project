// server/middleware/security.js
//
// Sets the same class of protective headers the popular "helmet" package
// applies, without adding a dependency. Mitigates clickjacking, MIME-type
// sniffing, and reduces information leakage.

function securityHeaders(req, res, next) {
  res.removeHeader('X-Powered-By'); // don't advertise "Express" to attackers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY'); // blocks clickjacking via iframes
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // Only takes effect once you serve this over HTTPS in production:
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  next();
}

module.exports = { securityHeaders };
