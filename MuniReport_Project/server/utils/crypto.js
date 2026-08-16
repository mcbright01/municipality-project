// server/utils/crypto.js
//
// Security helpers built entirely on Node's built-in `crypto` module.
// No plaintext passwords ever touch the database, and no session data
// is trusted unless its signature verifies.
//
//  - Passwords: hashed with scrypt (a slow, memory-hard KDF) + a unique
//    random salt per user. This is the same category of protection as
//    bcrypt — the point is that hashing is one-way and salted, so a
//    leaked database does not reveal usable passwords.
//  - Sessions: a signed token (HMAC-SHA256), the same design JWTs use —
//    header.payload.signature, base64url-encoded. The server can verify
//    a token wasn't tampered with without needing to store sessions.

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error('SESSION_SECRET is not set. Add it to your .env file (see .env.example).');
}

const SCRYPT_KEYLEN = 64;
const TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes, matches the project's session-timeout requirement

// ---------- Password hashing ----------

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const [, salt, hashHex] = storedHash.split('$');
  const derivedKey = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN);
  const storedBuffer = Buffer.from(hashHex, 'hex');
  if (storedBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(derivedKey, storedBuffer);
}

// ---------- Session tokens ----------

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadObj) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'SESSION' }));
  const payload = base64url(JSON.stringify(payloadObj));
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.user_id,
    role: user.role,
    name: user.full_name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  return sign(payload);
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && now > decoded.exp) return null; // expired

  return decoded;
}

module.exports = { hashPassword, verifyPassword, createSessionToken, verifySessionToken };
