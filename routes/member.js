const express = require('express');
const db = require('../lib/db');
const { requireMember } = require('../lib/auth');
const r2 = require('../lib/r2');
const { memberPage } = require('../views/member');

const router = express.Router();

router.get('/member', requireMember, async (req, res) => {
  try {
    const memberResult = await db.query(
      'SELECT id, email, tier, ebook_sent_at, created_at FROM members WHERE id = $1',
      [req.memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.redirect('/');
    }

    const member = memberResult.rows[0];
    const cap = Number(process.env.FOUNDING_CAP || 100);

    const rankResult = await db.query(
      `SELECT COUNT(*)::int AS rank FROM members WHERE tier = 'founding' AND id <= $1`,
      [member.id]
    );

    const pendingResult = await db.query(
      `SELECT id FROM testimonials WHERE member_id = $1 AND approved = false`,
      [member.id]
    );

    let ebookUrl = null;
    if (member.ebook_sent_at) {
      ebookUrl = await r2.getEbookDownloadUrl();
    }

    res.send(
      memberPage({
        member,
        memberNumber: rankResult.rows[0].rank,
        cap,
        ebookUrl,
        hasPendingTestimonial: pendingResult.rows.length > 0,
        testimonialStatus: req.query.testimonial || null
      })
    );
  } catch (err) {
    console.error('member page failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.post('/member/testimonial', requireMember, async (req, res) => {
  const body = String(req.body.body || '').trim();
  const authorName = String(req.body.author_name || '').trim();

  if (!body || !authorName) {
    return res.redirect('/member?testimonial=invalid');
  }

  try {
    const pendingResult = await db.query(
      `SELECT id FROM testimonials WHERE member_id = $1 AND approved = false`,
      [req.memberId]
    );

    if (pendingResult.rows.length > 0) {
      return res.redirect('/member?testimonial=pending');
    }

    await db.query(
      `INSERT INTO testimonials (source, author_name, body, approved, member_id)
       VALUES ('member', $1, $2, false, $3)`,
      [authorName, body, req.memberId]
    );

    res.redirect('/member?testimonial=submitted');
  } catch (err) {
    console.error('testimonial submit failed:', err);
    res.redirect('/member?testimonial=error');
  }
});

module.exports = router;
