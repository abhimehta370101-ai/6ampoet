const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SECRET;
const MEMBER_COOKIE = 'session';
const ADMIN_COOKIE = 'admin_session';
const MEMBER_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_SESSION_MS = 24 * 60 * 60 * 1000;
const MAGIC_TOKEN_MS = 15 * 60 * 1000;

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- Magic link tokens (raw token emailed to user, only the SHA-256 hash stored) ---

function generateMagicToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashMagicToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function magicTokenExpiry() {
  return new Date(Date.now() + MAGIC_TOKEN_MS);
}

// --- Member session cookie: memberId.expiry.HMAC(memberId + expiry) ---

function createMemberSession(memberId) {
  const expiry = Date.now() + MEMBER_SESSION_MS;
  const payload = `${memberId}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

function verifyMemberSession(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [memberId, expiry, sig] = parts;
  const payload = `${memberId}.${expiry}`;
  if (!timingSafeEqualStr(sig, sign(payload))) return null;
  if (Date.now() > Number(expiry)) return null;
  const id = Number(memberId);
  if (!Number.isInteger(id)) return null;
  return id;
}

// --- Admin session cookie: expiry.HMAC('admin.' + expiry) ---

function createAdminSession() {
  const expiry = Date.now() + ADMIN_SESSION_MS;
  const payload = `admin.${expiry}`;
  return `${expiry}.${sign(payload)}`;
}

function verifyAdminSession(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiry, sig] = parts;
  const payload = `admin.${expiry}`;
  if (!timingSafeEqualStr(sig, sign(payload))) return false;
  if (Date.now() > Number(expiry)) return false;
  return true;
}

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge
});

function setMemberCookie(res, memberId) {
  res.cookie(MEMBER_COOKIE, createMemberSession(memberId), cookieOpts(MEMBER_SESSION_MS));
}

function clearMemberCookie(res) {
  res.clearCookie(MEMBER_COOKIE);
}

function setAdminCookie(res) {
  res.cookie(ADMIN_COOKIE, createAdminSession(), cookieOpts(ADMIN_SESSION_MS));
}

function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE);
}

function requireMember(req, res, next) {
  const memberId = verifyMemberSession(req.cookies[MEMBER_COOKIE]);
  if (!memberId) {
    return res.redirect('/');
  }
  req.memberId = memberId;
  next();
}

function requireAdmin(req, res, next) {
  if (!verifyAdminSession(req.cookies[ADMIN_COOKIE])) {
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = {
  generateMagicToken,
  hashMagicToken,
  magicTokenExpiry,
  setMemberCookie,
  clearMemberCookie,
  setAdminCookie,
  clearAdminCookie,
  requireMember,
  requireAdmin
};
