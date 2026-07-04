const express = require('express');
const db = require('../lib/db');
const rateLimit = require('../lib/rateLimit');
const {
  generateMagicToken,
  hashMagicToken,
  magicTokenExpiry,
  setMemberCookie,
  clearMemberCookie
} = require('../lib/auth');
const { sendMagicLinkEmail, sendFoundingWelcomeEmail } = require('../lib/email');
const r2 = require('../lib/r2');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = 'Check your inbox — your link is on the way.';

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

router.post('/auth/request', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, message: 'Enter a valid email address.' });
  }

  const ip = req.ip || 'unknown';
  const ipOk = rateLimit.hit(`req:ip:${ip}`, 5, 15 * 60 * 1000);
  const emailOk = rateLimit.hit(`req:email:${email}`, 3, 60 * 60 * 1000);

  if (!ipOk || !emailOk) {
    // Return the same generic success message even when throttled, so we
    // don't leak whether an email/IP is being rate limited.
    return res.json({ ok: true, message: GENERIC_MESSAGE });
  }

  try {
    const existing = await db.query('SELECT id FROM members WHERE email = $1', [email]);
    const purpose = existing.rows.length > 0 ? 'login' : 'signup';

    const token = generateMagicToken();
    const tokenHash = hashMagicToken(token);

    await db.query(
      `INSERT INTO magic_tokens (email, token_hash, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [email, tokenHash, purpose, magicTokenExpiry()]
    );

    const link = `${process.env.APP_URL}/auth/verify?token=${token}`;
    await sendMagicLinkEmail({ to: email, link });

    return res.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('auth/request failed:', err);
    // Still return the generic message — never reveal internal state to the client.
    return res.json({ ok: true, message: GENERIC_MESSAGE });
  }
});

router.get('/auth/verify', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.redirect('/?auth=invalid');

  const tokenHash = hashMagicToken(token);

  try {
    const result = await db.query(
      `SELECT id, email FROM magic_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.redirect('/?auth=invalid');
    }

    const { id: tokenId, email } = result.rows[0];
    await db.query('UPDATE magic_tokens SET used_at = now() WHERE id = $1', [tokenId]);

    const memberResult = await db.query('SELECT id FROM members WHERE email = $1', [email]);

    if (memberResult.rows.length > 0) {
      setMemberCookie(res, memberResult.rows[0].id);
      return res.redirect('/member');
    }

    const cap = Number(process.env.FOUNDING_CAP || 100);
    const countResult = await db.query("SELECT COUNT(*)::int AS count FROM members WHERE tier = 'founding'");
    const foundingCount = countResult.rows[0].count;

    if (foundingCount >= cap) {
      await db.query(
        'INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
      return res.redirect('/?waitlisted=1');
    }

    const insertResult = await db.query(
      `INSERT INTO members (email, tier, status) VALUES ($1, 'founding', 'active') RETURNING id`,
      [email]
    );
    const memberId = insertResult.rows[0].id;

    const rankResult = await db.query(
      `SELECT COUNT(*)::int AS rank FROM members WHERE tier = 'founding' AND id <= $1`,
      [memberId]
    );
    const memberNumber = rankResult.rows[0].rank;

    let ebookUrl = null;
    if (await r2.ebookExists()) {
      ebookUrl = await r2.getEbookDownloadUrl();
      await db.query('UPDATE members SET ebook_sent_at = now() WHERE id = $1', [memberId]);
    }

    try {
      await sendFoundingWelcomeEmail({ to: email, memberNumber, ebookUrl });
    } catch (emailErr) {
      // The member record and cookie below are the source of truth for membership;
      // a failed welcome email shouldn't lock the new member out of their own account.
      console.error('founding welcome email failed:', emailErr);
    }

    setMemberCookie(res, memberId);
    return res.redirect('/member');
  } catch (err) {
    console.error('auth/verify failed:', err);
    return res.redirect('/?auth=error');
  }
});

router.post('/auth/logout', (req, res) => {
  clearMemberCookie(res);
  res.redirect('/');
});

module.exports = router;
