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
### Keepalive on Render (prevent sleep)

Two supported tactics to keep the Render web service warm:

1) Server-side self‑ping (no extra services)
   - Set environment variables on your Render Web Service:
     - `KEEPALIVE=1`
     - `RENDER_EXTERNAL_URL` (Render sets this automatically; or set `KEEPALIVE_PING_URL` explicitly)
     - Optional: `KEEPALIVE_INTERVAL_MS` (default 180000 = 3 minutes)
   - The app will periodically HEAD/GET one of these endpoints:
     - `/api/health` (preferred)
     - `/api/keepalive`
     - `/` (fallback)
   - Implemented in `instrumentation.ts` and runs when the server boots.

2) External ping (Render Cron Job or uptime monitor)
   - Use the included endpoint: `GET https://<your-host>/api/keepalive`
   - Optional protection: set `KEEPALIVE_TOKEN` env var and ping with `?token=<value>` or header `X-Keepalive-Token: <value>`.
   - On Render, create a Cron Job service to call this endpoint every 3–5 minutes.

Notes:
- Health endpoint: `/api/health` supports GET/HEAD and disables caching.
- Keepalive endpoint: `/api/keepalive` returns 204 quickly and is suitable for external pingers.

## Test credentials

Local seed creates three users with the same password:

Local seed creates additional users (all with Password123!):

- therapist@example.com (THERAPIST)
- therapist2@example.com (THERAPIST)
- therapist3@example.com (THERAPIST)
- parent@example.com (PARENT)
- parent2@example.com (PARENT)
- admin@example.com (ADMIN)

Directory API (RBAC):
- GET /api/directory/staff?search=...&role=THERAPIST|ADMIN
- GET /api/directory/students?search=...
Use the Login link in the header or navigate to `/login`.
- Dockerfile + docker-compose (includes MinIO).
- GitHub Actions CI for install/lint/typecheck/build. // Insert repo URL

## Customization & Branding
- Logo/name: `components/Header.tsx`, `app/page.tsx`.
- Colors: `tailwind.config.ts`.
- Languages: `app/settings/page.tsx` // Insert supported languages
- Legal disclaimers, emergency protocols, onboarding: see comments in pages.
