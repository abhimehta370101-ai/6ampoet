require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const splashRoutes = require('./routes/splash');
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const adminRoutes = require('./routes/admin');
const { requireAdmin } = require('./lib/auth');

const app = express();

app.set('trust proxy', 1);

const CARD_PATH = path.join(__dirname, 'assets', '6ampoet-card.pdf');
if (!fs.existsSync(CARD_PATH)) {
  console.warn(`WARNING: ${CARD_PATH} is missing — /card/download will fail until it's added.`);
}

// The page-viewer iframes every route on the same origin, so it needs
// frame-ancestors 'self' — scoped to when the flag is on so production's
// CSP stays exactly as strict as before.
const PREVIEW_ENABLED = process.env.ENABLE_PREVIEW === '1';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        ...(PREVIEW_ENABLED ? { frameAncestors: ["'self'"] } : {})
      }
    },
    frameguard: PREVIEW_ENABLED ? { action: 'sameorigin' } : undefined
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(splashRoutes);
app.use(publicRoutes);
app.use(authRoutes);
app.use(memberRoutes);
app.use(adminRoutes);

if (PREVIEW_ENABLED) {
  app.use('/preview', requireAdmin, require('./routes/preview'));
}

app.use((req, res) => {
  res.status(404).send('Not found.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`6ampoet listening on port ${port}`);
});
