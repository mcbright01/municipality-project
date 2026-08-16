// server/utils/rateLimit.js
//
// Lightweight, dependency-free brute-force protection. For a small
// single-instance deployment like this one, in-memory tracking is fine;
// if you ever run multiple server instances behind a load balancer,
// swap this for a shared store (e.g. Redis) so limits apply across them.

const attemptsByKey = new Map(); // key -> { count, firstAttempt, lockedUntil }

const WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const MAX_ATTEMPTS = 5;              // failures allowed per window before lockout
const LOCKOUT_MS = 15 * 60 * 1000;   // lockout duration once tripped

function keyFor(req, identifier) {
  // Combine IP + the account being targeted, so one attacker can't lock out
  // someone else's account just by guessing their email a few times from
  // a shared IP, while still rate-limiting per-account brute force.
  return `${req.ip}:${identifier.toLowerCase()}`;
}

// Call before attempting a login. Throws-by-return: returns a message if
// blocked, or null if the request may proceed.
function checkLocked(req, identifier) {
  const key = keyFor(req, identifier);
  const entry = attemptsByKey.get(key);
  if (!entry) return null;

  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Try again in ${minutesLeft} minute(s).`;
  }
  return null;
}

function recordFailure(req, identifier) {
  const key = keyFor(req, identifier);
  const now = Date.now();
  const entry = attemptsByKey.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  if (now - entry.firstAttempt > WINDOW_MS) {
    // window expired, start fresh
    entry.count = 0;
    entry.firstAttempt = now;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  attemptsByKey.set(key, entry);
}

function recordSuccess(req, identifier) {
  attemptsByKey.delete(keyFor(req, identifier));
}

// Simple global request-rate limiter, applied per-IP to a route.
// Returns Express middleware.
function rateLimit({ windowMs = 60 * 1000, max = 20 } = {}) {
  const hits = new Map(); // ip -> { count, windowStart }

  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip) || { count: 0, windowStart: now };

    if (now - entry.windowStart > windowMs) {
      entry.count = 0;
      entry.windowStart = now;
    }
    entry.count += 1;
    hits.set(req.ip, entry);

    if (entry.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please slow down and try again shortly.' });
    }
    next();
  };
}

module.exports = { checkLocked, recordFailure, recordSuccess, rateLimit };
