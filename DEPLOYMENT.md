# NAMO — Deployment Guide

> **Stack:** Next.js 16 · Prisma v7 · libsql/Turso · Vercel

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Local Development](#2-local-development)
3. [Turso Setup (Database)](#3-turso-setup-database)
4. [Vercel Setup (Hosting)](#4-vercel-setup-hosting)
5. [Database Migrations](#5-database-migrations)
6. [Seeding Demo Data](#6-seeding-demo-data)
7. [Production Build & Validation](#7-production-build--validation)
8. [Environment Differences](#8-environment-differences)

---

## 1. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | `file:./dev.db` (local) or `libsql://[name]-[org].turso.io` (Turso) |
| `DATABASE_AUTH_TOKEN` | Turso only | Auth token from Turso dashboard |
| `JWT_SECRET` | **Yes (prod)** | Long random string for signing sessions — `openssl rand -base64 32` |
| `RESEND_API_KEY` | Optional | Resend API key for transactional email — emails skipped if absent |
| `RESEND_FROM_EMAIL` | Optional | Sender address, e.g. `NAMO <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Optional | Full app URL used in email CTA links — defaults to `http://localhost:3000` |

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

---

## 2. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# Edit .env — DATABASE_URL="file:./dev.db" is already set for local use

# 3. Apply migrations (creates dev.db if it doesn't exist)
npx prisma migrate dev

# 4. Seed demo data (19 users, 3 projects, full dataset)
npm run seed

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

Demo login credentials:
- **Manager:** `sarah@namo.dev` / `manager123`
- **Senior Dev:** `alex@namo.dev` / `senior123`
- **Developer:** `emma@namo.dev` / `dev123`

All 19 demo accounts are shown in the accordion on the login page.

---

## 3. Turso Setup (Database)

### 3.1 Install the Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
winget install turso
```

### 3.2 Create a database

```bash
turso auth login
turso db create namo-staging    # or namo-production
turso db show namo-staging      # copy the URL shown
```

### 3.3 Get the auth token

```bash
turso db tokens create namo-staging
```

### 3.4 Set env vars

Add to Vercel (or your `.env.staging`):

```
DATABASE_URL=libsql://namo-staging-<org>.turso.io
DATABASE_AUTH_TOKEN=<token from step 3.3>
```

---

## 4. Vercel Setup (Hosting)

### 4.1 Connect repository

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import the GitHub repo (`ai-project-intelligence`)
3. Framework preset: **Next.js** (auto-detected)

### 4.2 Set environment variables

In **Project → Settings → Environment Variables**, add:

| Key | Value | Environments |
|---|---|---|
| `DATABASE_URL` | `libsql://namo-staging-<org>.turso.io` | Preview, Production |
| `DATABASE_AUTH_TOKEN` | `<turso token>` | Preview, Production |
| `JWT_SECRET` | `<openssl rand -base64 32>` | Preview, Production |
| `RESEND_API_KEY` | `re_...` | Production (optional) |
| `RESEND_FROM_EMAIL` | `NAMO <noreply@yourdomain.com>` | Production (optional) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

### 4.3 Deploy

```bash
# Option A: push to main — Vercel auto-deploys
git push origin main

# Option B: manual deploy via CLI
npm i -g vercel
vercel --prod
```

### 4.4 Build settings (defaults are correct)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `.next` |
| Install command | `npm install` |
| Node.js version | 20.x |

No `vercel.json` is needed — Next.js is auto-configured.

---

## 5. Database Migrations

### Local (SQLite file)

```bash
# Create and apply a new migration
npx prisma migrate dev --name describe-your-change

# Apply existing migrations only (no new migration)
npx prisma migrate deploy
```

### Turso (staging / production)

Prisma migrate does not yet support Turso via `prisma migrate deploy` for remote libsql.  
Use the **Turso shell** to run the SQL directly:

```bash
# Show what SQL to run (dry-run)
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# Apply migrations manually via Turso shell
turso db shell namo-staging < prisma/migrations/<migration>/migration.sql
```

**Or** run all migrations in order:

```bash
for f in prisma/migrations/*/migration.sql; do
  echo "Applying $f..."
  turso db shell namo-staging < "$f"
done
```

> The migration lock file (`prisma/migrations/migration_lock.toml`) tracks which migrations
> exist but Turso won't track which ones have run. Apply them once, in order, idempotently.
> All DDL in the migrations is safe to re-run (SQLite `CREATE TABLE IF NOT EXISTS`).

---

## 6. Seeding Demo Data

### Local

```bash
npm run seed
```

### Staging (Turso)

Set your Turso env vars in `.env` (or inline), then:

```bash
DATABASE_URL="libsql://namo-staging-<org>.turso.io" \
DATABASE_AUTH_TOKEN="<token>" \
npm run seed
```

> ⚠️ The seed script **wipes all data** before inserting. Only run it on staging/dev — never on production with real users.

### Production — no seed

Production should start empty. Create your own manager account via:

1. Run the app locally pointed at your production DB
2. `POST /api/users` with manager credentials (requires an existing manager session — see bootstrap note below)

**Bootstrap note:** The first manager user must be created directly in the DB until a setup flow exists:

```bash
# Using Turso shell
turso db shell namo-production
# Then run INSERT INTO User ... with a bcrypt-hashed password
```

Or seed production once with a minimal admin-only seed (no demo data).

---

## 7. Production Build & Validation

```bash
# TypeScript check
npx tsc --noEmit

# Production build
npm run build

# Start production server locally (uses .env values)
npm start
```

Expected output: all routes compile, 0 TypeScript errors, `✓ Compiled successfully`.

---

## 8. Environment Differences

| | Local | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | `libsql://...turso.io` | `libsql://...turso.io` |
| `DATABASE_AUTH_TOKEN` | *(not set)* | Turso token | Turso token |
| `JWT_SECRET` | *(fallback default)* | Random secret | Random secret |
| `RESEND_API_KEY` | *(not set — emails skipped)* | Optional | Recommended |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Vercel preview URL | Production URL |
| Seed data | Yes (`npm run seed`) | Yes (staging only) | No |
| Migrations | `prisma migrate dev` | Manual SQL via Turso CLI | Manual SQL via Turso CLI |

---

## Quick Reference

```bash
# Full local setup from scratch
npm install && cp .env.example .env && npx prisma migrate dev && npm run seed && npm run dev

# TypeScript + build check
npx tsc --noEmit && npm run build

# Reseed local data
npm run seed

# Regenerate Prisma client (after schema changes)
npx prisma generate
# ⚠️ Restart dev server after generate — Prisma singleton caches old client
```
