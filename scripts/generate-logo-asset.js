// One-off build-time script: crop the sun-circle icon out of the full logo
// lockup (which has a solid white background, no alpha) and chroma-key the
// white to transparent so it can sit cleanly on the splash page's gradient
// sky. Also exports the full square lockup as a favicon (solid white bg is
// fine there since it renders in browser chrome, not on a gradient).
//
// Run manually: node scripts/generate-logo-asset.js
// Requires a transient `npm install --no-save sharp` (not a runtime dep).

const path = require("path");
const sharp = require("sharp");

const SOURCE = path.join(__dirname, "..", "Sunrise Inspiration_ 6am Poet Logo.png");
const OUT_DIR = path.join(__dirname, "..", "public", "img");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Crop box around the sun circle only (tune by eye against CROP_DEBUG output).
const CROP = { left: 520, top: 235, width: 300, height: 300 };

// Chroma-key thresholds: pixels with min(R,G,B) >= HIGH become fully
// transparent, <= LOW stay fully opaque, values between are feathered so
// anti-aliased edges don't leave a white fringe.
const LOW = 235;
const HIGH = 253;

function chromaKeyWhite(data) {
  for (let i = 0; i < data.length; i += 4) {
    const minCh = Math.min(data[i], data[i + 1], data[i + 2]);
    let alpha;
    if (minCh >= HIGH) alpha = 0;
    else if (minCh <= LOW) alpha = 255;
    else alpha = Math.round((255 * (HIGH - minCh)) / (HIGH - LOW));
    data[i + 3] = alpha;
  }
  return data;
}

async function main() {
  const fs = require("fs");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (process.argv.includes("--debug-crop")) {
    // Dump just the crop, no chroma-key, so the CROP box can be eyeballed.
    await sharp(SOURCE).extract(CROP).png().toFile(path.join(OUT_DIR, "_crop-debug.png"));
    console.log("Wrote", path.join(OUT_DIR, "_crop-debug.png"));
    return;
  }

  // 1. Sun-circle icon, transparent, for the hero slot.
  const cropped = sharp(SOURCE).extract(CROP).resize(320, 320);
  const { data, info } = await cropped.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  chromaKeyWhite(data);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(OUT_DIR, "6ampoet-sun.png"));
  console.log("Wrote", path.join(OUT_DIR, "6ampoet-sun.png"));

  // 2. Full square lockup as favicon (solid white bg is fine for browser chrome).
  await sharp(SOURCE).resize(256, 256).png().toFile(path.join(PUBLIC_DIR, "favicon.png"));
  await sharp(SOURCE).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
  console.log("Wrote favicon.png and apple-touch-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
