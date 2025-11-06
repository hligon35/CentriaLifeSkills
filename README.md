# ABA Therapy School App (BuddyBoard)

Secure, responsive communication platform for therapists and parents. Ready for branding and legal review.

## Features

- JWT auth with RBAC (Therapist, Parent, Admin)
- Chat with media sharing (E2EE-ready)
- Message board threads and replies
- Notifications (in-app; email/SMS stubs)
- Responsive UI, settings, localization placeholder
- Rate limiting, validation, storage via S3/MinIO

## Quickstart (Windows PowerShell)

```powershell
# 1) Install deps
npm install

# 2) Generate Prisma client and DB
npx prisma generate
npx prisma migrate dev --name init

# 3) Seed sample users (therapist@example.com / parent@example.com ; Password123!)
npm run seed

# 4) Run
npm run dev
```

## Environment

- Copy `.env.example` to `.env` and fill in:
  - JWT_SECRET
  - DATABASE_URL (prod) // Insert organization-specific database credentials
  - S3 credentials or use docker-compose MinIO
  - SENDGRID/TWILIO if enabling email/SMS
  - SENTRY_DSN for error tracking

## Security & Privacy

## DevOps

### Local server + custom domain (buddyboard.getsparqd.com)

This repo includes docker-compose for the app and MinIO, plus Caddy as a reverse proxy/SSL terminator.

Prereqs:

- DNS: Point an A/AAAA record for `buddyboard.getsparqd.com` to your server's IP.
- Firewall: Open ports 80 and 443 to the internet.
- Docker + Docker Compose installed on the host.

Files:

- `docker-compose.yml`: app, minio, and caddy services
- `Caddyfile`: routes `buddyboard.getsparqd.com` to the app service (port 3000)

Bring up the stack (from repo root):

- Optional first run: build the image (the build runs `prisma generate`)
- Start services: `docker compose up -d`
- Wait ~30–60s for Caddy to obtain TLS certs from Let's Encrypt.

Seed users (once):

- Option A (CLI, local dev DB): `npm run seed` (creates admin/parent/therapist and demo data)
- Option B (production, minimal users only): call the admin seed endpoint safely:
  - Set an env var on the app: `ADMIN_MAINT_TOKEN=<strong random>`
  - POST `https://buddyboard.getsparqd.com/api/admin/seed/basic?token=<ADMIN_MAINT_TOKEN>`
  - Then remove/unset `ADMIN_MAINT_TOKEN`.

Notes:

- Health check: `GET /api/health`
- MinIO console: `http://<server>:9001` (default creds minioadmin/minioadmin)

### Production: verify and quick‑seed default users

If login fails on your live site using the test credentials, your production database likely doesn't have the seeded users yet.

Safe, token‑gated maintenance endpoints are included to help you verify and seed once:

1. Configure a strong token in your hosting environment

```bash
ADMIN_MAINT_TOKEN=<a long random string>
```

2. Verify whether the three defaults exist

- `GET https://YOUR_HOST/api/admin/debug/users?token=ADMIN_MAINT_TOKEN`
- Response shows total user count and existence flags for therapist/parent/admin.

3. Seed the three defaults if missing

- `POST https://YOUR_HOST/api/admin/seed/basic?token=ADMIN_MAINT_TOKEN`
- Creates/upserts:
  - therapist@example.com (THERAPIST)
  - parent@example.com (PARENT)
  - admin@example.com (ADMIN)
- All with password: Password123!

4. Important: remove the token afterwards

- Unset ADMIN_MAINT_TOKEN after you're done to disable these endpoints.

### Production: apply database migrations on deploy

If you see Internal Server Error on login in production, it often means the database schema hasn’t been created yet.

On Render, add a Post-deploy command to apply migrations:

```bash
npm run prisma:migrate:deploy
```

Requirements:
- DATABASE_URL must point to a real, persistent database.
- For production, prefer a managed Postgres instance (recommended). If you used SQLite locally, switch the Prisma datasource provider and run a fresh migration for Postgres.

Notes:
- Using SQLite in a web service on Render is not recommended unless you attach a persistent disk and understand the limitations.

### Auto-rebuild and refresh on live changes (CI/CD)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

What it does on every push to `main`:

- Installs dependencies, generates Prisma client, typechecks, builds Next.js
- Builds and pushes a Docker image to GHCR `ghcr.io/<owner>/<repo>:latest`
- SSHes into your server and restarts the `app` service with Docker Compose

To enable it, add repository secrets:

- `SSH_HOST`: server hostname or IP
- `SSH_USER`: SSH username
- `SSH_KEY`: private key for the user (PEM)
- `SSH_PORT` (optional): SSH port if not 22
- `APP_DIR`: absolute path on the server containing `docker-compose.yml`

Server prerequisites:

- Docker + Docker Compose v2 installed
- The server can access GHCR (workflow logs in during deploy)
- If you use a CDN, purge cache after deploys for immediate asset refresh

Local instant refresh remains available with `npm run dev` (Next.js Fast Refresh/HMR).

## Test credentials

Local seed creates additional users (all with Password123!):

- `therapist@example.com` (THERAPIST)
- `therapist2@example.com` (THERAPIST)
- `therapist3@example.com` (THERAPIST)
- `parent@example.com` (PARENT)
- `parent2@example.com` (PARENT)
- `admin@example.com` (ADMIN)

Directory API (RBAC):

- GET /api/directory/staff?search=...&role=THERAPIST|ADMIN
- GET /api/directory/students?search=...

Use the Login link in the header or navigate to `/login`.

- Dockerfile + docker-compose (includes MinIO and Caddy).
- GitHub Actions CI for install/lint/typecheck/build. // Insert repo URL

## Customization & Branding

- Logo/name: `components/Header.tsx`, `app/page.tsx`.
- Colors: `tailwind.config.ts`.
- Languages: `app/settings/page.tsx` // Insert supported languages
- Legal disclaimers, emergency protocols, onboarding: see comments in pages.
