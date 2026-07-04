const express = require('express');
const db = require('../lib/db');
const { landing } = require('../views/landing');

const router = express.Router();

router.get('/healthz', (req, res) => res.status(200).send('ok'));

router.get('/join', async (req, res) => {
  const cap = Number(process.env.FOUNDING_CAP || 100);

  try {
    const [countResult, testimonialsResult] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM members WHERE tier = 'founding'"),
      db.query(
        `SELECT author_name, body, source FROM testimonials
         WHERE approved = true
         ORDER BY display_order ASC, created_at ASC`
      )
    ]);

    let banner = null;
    if (req.query.waitlisted) {
      banner = "The Founding 100 is full — you're on the waitlist. We'll email you when the paid membership opens.";
    } else if (req.query.auth === 'invalid') {
      banner = 'That link has expired or already been used. Enter your email again for a fresh one.';
    } else if (req.query.auth === 'error') {
      banner = 'Something went wrong. Please try again.';
    }

    res.send(
      landing({
        foundingCount: countResult.rows[0].count,
        cap,
        testimonials: testimonialsResult.rows,
        banner
      })
    );
  } catch (err) {
    console.error('landing page failed:', err);
    res.status(500).send('Something went wrong.');
  }
});

module.exports = router;
