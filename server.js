require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(publicRoutes);
app.use(authRoutes);
app.use(memberRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  res.status(404).send('Not found.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`6ampoet listening on port ${port}`);
});
