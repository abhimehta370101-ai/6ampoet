require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const statements = [
  `CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL DEFAULT 'founding',
    status TEXT NOT NULL DEFAULT 'active',
    ebook_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS magic_tokens (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    member_id INT REFERENCES members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS card_downloads (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_tokens(email)`,
  `CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved, display_order, created_at)`
];

async function migrate() {
  const client = await pool.connect();
  try {
    for (const sql of statements) {
      await client.query(sql);
    }
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
