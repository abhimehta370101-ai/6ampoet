# 6ampoet — Founding 100 launch site

Phase 0: a founding-member landing page with magic-link signup, a live spot counter,
testimonials, a minimal member area, and an admin panel. Vanilla Node/Express + Postgres,
no frontend framework, no ORM.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, RESEND_API_KEY, SESSION_SECRET, etc.
npm run migrate
npm run hash-password -- "your-admin-password"   # paste result into ADMIN_PASSWORD_HASH
npm start
```

The app listens on `PORT` (defaults to 3000).

## Deployment

### 1. Railway

1. Create a new Railway project from this repo.
2. Add the **PostgreSQL** plugin — Railway sets `DATABASE_URL` automatically.
3. Set the remaining environment variables in the Railway service settings:
   `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `EBOOK_R2_KEY` (leave empty until the ebook is uploaded), `FOUNDING_CAP`.
4. Deploy from the repo. Railway runs `npm start`.
5. Run the migration once as a one-off command in the Railway service shell:
   ```bash
   npm run migrate
   ```

### 2. Cloudflare DNS

1. Add a CNAME record for your domain (e.g. `6ampoet.com` or `www`) pointing at the
   Railway-provided domain.
2. Set the proxy status to **Proxied** (orange cloud).
3. Set SSL/TLS mode to **Full (strict)**.
4. In Railway, add the same domain as a custom domain for the service and follow any
   verification steps Railway shows.

### 3. Resend (email sending domain)

1. Add and verify your sending domain in the Resend dashboard.
2. Add the SPF and DKIM records Resend gives you as DNS records in Cloudflare.
3. Once verified, set `EMAIL_FROM` to an address on that domain (e.g.
   `6ampoet <hello@6ampoet.com>`).

### 4. Cloudflare R2 (ebook storage)

1. Create an R2 bucket for the site (e.g. `6ampoet`).
2. Create an R2 API token with read/write access to that bucket; use the resulting
   Account ID, Access Key ID, and Secret Access Key for `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
3. Set `R2_BUCKET` to the bucket name.
4. When the *100 Poetry Prompts* ebook PDF is ready, upload it to the bucket and set
   `EBOOK_R2_KEY` to its path/key (e.g. `ebooks/100-poetry-prompts.pdf`), then redeploy
   or restart the service so the new env var is picked up.
5. Once `EBOOK_R2_KEY` is set and the object exists, the admin dashboard's ebook blast
   button becomes enabled and new founding-member welcome emails include the download
   link automatically.

## Project layout

- `server.js` — Express app setup (helmet, cookies, static files, route mounting).
- `routes/` — `public.js` (landing page, health check), `auth.js` (magic link request
  and verify), `member.js` (member area), `admin.js` (admin panel).
- `lib/` — `db.js` (pg pool), `auth.js` (HMAC session cookies, magic token helpers),
  `email.js` (Resend templates), `r2.js` (presigned ebook URLs), `rateLimit.js`
  (in-memory limiter), `escape.js` (HTML escaping for server-rendered views).
- `views/` — server-rendered HTML via plain template-literal functions.
- `public/` — CSS and the small vanilla JS file for the signup form.
- `migrate.js` — idempotent schema migration (`CREATE TABLE IF NOT EXISTS`).
- `scripts/hash-password.js` — generates a bcrypt hash for `ADMIN_PASSWORD_HASH`.

## Testing the cap behavior locally

Set `FOUNDING_CAP=2` in `.env` before running through the signup flow with a few test
email addresses to see the waitlist switch kick in once the cap fills.
