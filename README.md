# K2B Insurance — Quote Site + Agent Portal

Customer-facing insurance quote site and internal agent portal for
**K2B Insurance LLC** (independent agency, New Madrid, MO — inside Martindale
Chevrolet, 521 US-61).

- **Public site** — landing page + five 5-step quote wizards (Auto, Home,
  Commercial, Workers' Comp, Landlord) with per-step validation, review screen,
  and e-signature. Renters routes to the carrier partner's hosted form.
- **Agent portal** (`/portal`) — email/password sign-in, KPI tiles, lead search
  and product filters, lead detail with Q&A, status pipeline
  (New → Contacted → Quoted → Bound → Closed), print view, CSV export.
- **Backend** — Postgres via Prisma; leads from any device land in one shared
  database (replaces the prototype's per-device localStorage).

## Stack

Next.js 15 (App Router, standalone output) · React 19 · TypeScript ·
Prisma + PostgreSQL · JWT session cookies (jose) + bcrypt · Docker.

## Local development

```bash
npm install
cp .env.example .env.local            # then edit values
npm run db:up                         # local Postgres via docker compose
npx prisma migrate dev                # apply migrations
npm run db:seed                       # create the first agent account
npm run dev                           # http://localhost:3000
```

Environment variables are documented in [`.env.example`](.env.example).
`DATABASE_URL` and `AUTH_SECRET` are required.

## Deployment

**AWS Lightsail (recommended, one Ubuntu instance):** follow
[`deploy/LIGHTSAIL.md`](deploy/LIGHTSAIL.md) — a single script installs Docker,
builds the stack (app + Postgres + Caddy HTTPS), runs migrations, and seeds an
agent account.

**AWS App Runner + RDS (managed, scales further):** CDK app under
[`infra/`](infra/README.md).

Either way the same [`Dockerfile`](Dockerfile) is used; the container applies
`prisma migrate deploy` on start, then serves on port 3000
(health check: `/api/health`).

## Project layout

```
src/lib/quote-schemas.ts   # single source of truth: every wizard's steps/fields
src/lib/submissions.ts     # server-side validation + lead record shape
src/components/Wizard.tsx  # one reusable wizard, driven by the product schema
src/app/quote/[product]/   # /quote/auto, /quote/home, ... (SSG)
src/app/api/               # submissions (POST public, GET/PATCH/export authed), auth
src/app/portal/            # agent dashboard + login (server-gated)
prisma/                    # schema, migrations, seed
deploy/                    # Lightsail setup script, Caddyfile, runbook
infra/                     # optional CDK stack (App Runner + RDS)
```

## API

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/submissions` | public | Create a lead (server-side validates every required field) |
| `GET /api/submissions?product=&status=&q=` | agent | List/filter leads |
| `PATCH /api/submissions/:id` | agent | Update lead status only |
| `GET /api/submissions/export` | agent | CSV download (same filters) |
| `POST /api/auth/login` / `logout` | — | Agent session (httpOnly JWT cookie) |
| `GET /api/health` | public | Liveness probe |

## Managing agent accounts

Accounts are rows in the `Agent` table (bcrypt-hashed passwords). Create or
update one anytime with:

```bash
SEED_AGENT_EMAIL=you@k2binsurance.com SEED_AGENT_PASSWORD='...' \
SEED_AGENT_NAME='Your Name' npm run db:seed
```

(In production: `docker compose -f docker-compose.prod.yml exec app node prisma/seed.js`
with the same env vars.)
