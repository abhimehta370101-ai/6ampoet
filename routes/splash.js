// routes/splash.js
// Splash page + numbered-edition card download for 6ampoet.
//
// Privacy design, kept literal:
//   - card_downloads stores ONLY (id, created_at). No IP, no UA, no email.
//   - Rate limiting is GLOBAL (anonymous token bucket), not per-IP, so no
//     visitor identifier is ever held in memory or logged.
//   - The sixam_card cookie is first-party, carries no ID ("1"), and is used
//     only to load the page in its night state on return visits.
//
// Dependencies (add to package.json): pdf-lib
// Asset required: assets/6ampoet-card.pdf  (the two-page print card)

const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb, degrees } = require("pdf-lib");

const { pool } = require("../lib/db"); // Phase 0 pg pool — adjust import if named differently
const { renderSplash } = require("../views/splash");

const router = express.Router();

const CARD_PATH = path.join(__dirname, "..", "assets", "6ampoet-card.pdf");
const FOUNDING_CAP = parseInt(process.env.FOUNDING_CAP || "100", 10);
const COOKIE_NAME = "sixam_card";
const COOKIE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

// Cache the source PDF bytes once at boot (small file, avoids disk reads per hit).
let cardBytes = null;
function loadCardBytes() {
  if (!cardBytes) cardBytes = fs.readFileSync(CARD_PATH);
  return cardBytes;
}

/* ------------------------------------------------------------------ */
/* Global anonymous rate limit: N downloads per rolling minute, total. */
/* Deliberately not per-IP — we hold no visitor identifiers at all.    */
/* ------------------------------------------------------------------ */
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;
let windowStart = Date.now();
let windowCount = 0;

function globalLimitOk() {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= MAX_PER_WINDOW) return false;
  windowCount++;
  return true;
}

/* ------------------------------------------------------------------ */
/* GET /  — splash page                                                */
/* ------------------------------------------------------------------ */
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS n FROM members WHERE tier = 'founding'"
    );
    const hasCard = /(?:^|;\s*)sixam_card=1(?:;|$)/.test(req.headers.cookie || "");
    res
      .set("Cache-Control", "no-store")
      .type("html")
      .send(renderSplash({ foundingCount: rows[0].n, cap: FOUNDING_CAP, hasCard }));
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* GET /card/download — stamp serial, set cookie, stream PDF           */
/* ------------------------------------------------------------------ */
router.get("/card/download", async (req, res) => {
  if (!globalLimitOk()) {
    return res.status(429).json({ error: "Too many downloads right now. Try again shortly." });
  }

  try {
    // Atomic serial: the row id IS the edition number.
    const { rows } = await pool.query(
      "INSERT INTO card_downloads DEFAULT VALUES RETURNING id"
    );
    const serial = String(rows[0].id).padStart(3, "0");

    const doc = await PDFDocument.load(loadCardBytes());
    const font = await doc.embedFont(StandardFonts.TimesRomanItalic);

    // Stamp the poem side (page 2, index 1). The source art is rotated 90°,
    // so the stamp is rotated to match reading orientation.
    // TWEAK: after first deploy, open one download and nudge STAMP_X / STAMP_Y
    // until the serial sits cleanly near the @6ampoet corner.
    const page = doc.getPage(1);
    const { width } = page.getSize();
    const STAMP_X = width - 42; // distance in from the right edge
    const STAMP_Y = 115;        // distance up from the bottom edge — clears the confetti cluster
    page.drawText(`No. ${serial}`, {
      x: STAMP_X,
      y: STAMP_Y,
      size: 9,
      font,
      color: rgb(0.8, 0.498, 0.196), // bronze
      rotate: degrees(90),
    });

    const out = Buffer.from(await doc.save());

    // First-party, no-ID cookie: lets the splash load in night state on return.
    res.cookie(COOKIE_NAME, "1", {
      maxAge: COOKIE_MAX_AGE_MS,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });

    res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="6ampoet-card-no-${serial}.pdf"`,
        "X-Card-Serial": serial,
        "Cache-Control": "no-store",
      })
      .send(out);
  } catch (err) {
    console.error("card download failed:", err.message);
    res.status(500).json({ error: "Card download failed." });
  }
});

module.exports = router;
