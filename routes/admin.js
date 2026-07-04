const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../lib/db');
const rateLimit = require('../lib/rateLimit');
const { requireAdmin, setAdminCookie, clearAdminCookie } = require('../lib/auth');
const { sendEbookDeliveryEmail } = require('../lib/email');
const r2 = require('../lib/r2');
const { loginPage } = require('../views/admin/login');
const { dashboardPage } = require('../views/admin/dashboard');
const { membersPage } = require('../views/admin/members');
const { testimonialsPage } = require('../views/admin/testimonials');

const router = express.Router();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get('/admin/login', (req, res) => {
  res.send(loginPage({ error: req.query.error ? 'Invalid email or password.' : null }));
});

router.post('/admin/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const ip = req.ip || 'unknown';
  if (!rateLimit.hit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    return res.redirect('/admin/login?error=1');
  }

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!adminEmail || !hash || email !== adminEmail) {
    return res.redirect('/admin/login?error=1');
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return res.redirect('/admin/login?error=1');
  }

  setAdminCookie(res);
  res.redirect('/admin');
});

router.post('/admin/logout', (req, res) => {
  clearAdminCookie(res);
  res.redirect('/admin/login');
});

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const cap = Number(process.env.FOUNDING_CAP || 100);

    const [foundingResult, waitlistResult, pendingResult, ebookReady, cardTotalResult, cardRecentResult] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM members WHERE tier = 'founding'"),
      db.query('SELECT COUNT(*)::int AS count FROM waitlist'),
      db.query('SELECT COUNT(*)::int AS count FROM testimonials WHERE approved = false'),
      r2.ebookExists(),
      db.query('SELECT COUNT(*)::int AS count FROM card_downloads'),
      db.query("SELECT COUNT(*)::int AS count FROM card_downloads WHERE created_at > now() - interval '7 days'")
    ]);

    let blastResult = null;
    if (req.query.blastSent) {
      blastResult = { sent: Number(req.query.blastSent), failed: Number(req.query.blastFailed || 0) };
    }

    res.send(
      dashboardPage({
        foundingCount: foundingResult.rows[0].count,
        cap,
        waitlistCount: waitlistResult.rows[0].count,
        pendingTestimonialCount: pendingResult.rows[0].count,
        ebookReady,
        blastResult,
        cardDownloadsTotal: cardTotalResult.rows[0].count,
        cardDownloadsRecent: cardRecentResult.rows[0].count
      })
    );
  } catch (err) {
    console.error('admin dashboard failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.get('/admin/members', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, tier, ebook_sent_at, created_at,
        CASE WHEN tier = 'founding'
          THEN ROW_NUMBER() OVER (PARTITION BY tier ORDER BY id)
          ELSE NULL
        END AS member_number
      FROM members
      ORDER BY created_at ASC
    `);
    res.send(membersPage({ members: result.rows }));
  } catch (err) {
    console.error('admin members failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.get('/admin/members.csv', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, tier, ebook_sent_at, created_at,
        CASE WHEN tier = 'founding'
          THEN ROW_NUMBER() OVER (PARTITION BY tier ORDER BY id)
          ELSE NULL
        END AS member_number
      FROM members
      ORDER BY created_at ASC
    `);

    const csvEscape = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const header = ['email', 'member_number', 'tier', 'ebook_sent_at', 'created_at'];
    const lines = [header.join(',')];
    for (const m of result.rows) {
      lines.push(
        [m.email, m.member_number, m.tier, m.ebook_sent_at, m.created_at].map(csvEscape).join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    console.error('admin members csv failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.get('/admin/testimonials', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, source, author_name, body, approved, display_order, member_id, created_at
       FROM testimonials
       ORDER BY approved ASC, display_order ASC, created_at ASC`
    );

    const pending = result.rows.filter((t) => !t.approved);
    const published = result.rows.filter((t) => t.approved);

    res.send(testimonialsPage({ pending, published }));
  } catch (err) {
    console.error('admin testimonials failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.post('/admin/testimonials', requireAdmin, async (req, res) => {
  const authorName = String(req.body.author_name || '').trim();
  const body = String(req.body.body || '').trim();

  if (!authorName || !body) {
    return res.redirect('/admin/testimonials');
  }

  try {
    await db.query(
      `INSERT INTO testimonials (source, author_name, body, approved, display_order)
       VALUES ('instagram', $1, $2, true, 0)`,
      [authorName, body]
    );
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error('admin add testimonial failed:', err);
    res.redirect('/admin/testimonials');
  }
});

router.post('/admin/testimonials/:id/approve', requireAdmin, async (req, res) => {
  await db.query('UPDATE testimonials SET approved = true WHERE id = $1', [req.params.id]);
  res.redirect('/admin/testimonials');
});

router.post('/admin/testimonials/:id/reject', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
  res.redirect('/admin/testimonials');
});

router.post('/admin/testimonials/:id/update', requireAdmin, async (req, res) => {
  const authorName = String(req.body.author_name || '').trim();
  const body = String(req.body.body || '').trim();
  const displayOrder = Number(req.body.display_order) || 0;

  await db.query(
    'UPDATE testimonials SET author_name = $1, body = $2, display_order = $3 WHERE id = $4',
    [authorName, body, displayOrder, req.params.id]
  );
  res.redirect('/admin/testimonials');
});

router.post('/admin/testimonials/:id/delete', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
  res.redirect('/admin/testimonials');
});

router.post('/admin/ebook-blast', requireAdmin, async (req, res) => {
  try {
    const ready = await r2.ebookExists();
    if (!ready) {
      return res.redirect('/admin');
    }

    const result = await db.query(
      `SELECT id, email FROM members WHERE tier = 'founding' AND ebook_sent_at IS NULL ORDER BY id ASC`
    );

    let sent = 0;
    let failed = 0;

    for (const member of result.rows) {
      try {
        const url = await r2.getEbookDownloadUrl();
        await sendEbookDeliveryEmail({ to: member.email, url });
        await db.query('UPDATE members SET ebook_sent_at = now() WHERE id = $1', [member.id]);
        sent += 1;
      } catch (err) {
        console.error(`ebook blast failed for member ${member.id}:`, err);
        failed += 1;
      }
      await sleep(600);
    }

    res.redirect(`/admin?blastSent=${sent}&blastFailed=${failed}`);
  } catch (err) {
    console.error('admin ebook blast failed:', err);
    res.redirect('/admin');
  }
});

module.exports = router;
