# Deployment Guide: HelpBridge (Legacy Vercel Path)

> Status: Legacy deployment guide.
>
> The repo is being rebaselined away from Vercel dependence. Use this document
> only if you intentionally need the old Vercel deployment path. Do not treat
> it as the long-term production baseline.

Current production work should use the active direct-VPS path documented in:

1. [`docs/deployment/direct-vps-proof.md`](docs/deployment/direct-vps-proof.md)
2. [`docs/deployment/production-checklist.md`](docs/deployment/production-checklist.md)

The direct-VPS public cutover completed successfully on 2026-03-11. The app is
now live at `https://helpbridge.ca`, with `www.helpbridge.ca` redirecting to
the apex and the container bound privately at `127.0.0.1:3300`.

This document describes the older **Vercel** deployment path.

## 1. Prerequisites

- A GitHub account (where this repo is pushed).
- A Vercel account (if you are intentionally using the legacy deployment path).
- Your `OPENAI_API_KEY` (Required for the build step).

## 2. Deploy Steps

1. **Push Code:** Ensure your latest changes are pushed to GitHub `main` branch.
2. **Login to Vercel:** Go to [vercel.com](https://vercel.com) and log in.
3. **Add New Project:** Click **"Add New..."** -> **"Project"**.
4. **Import Git Repository:** Select `helpbridge-ca`.
5. **Configure Project:**

- **Framework Preset:** Next.js (Should auto-detect).
- **Root Directory:** `./` (Default).
- **Build Command:** `next build` (Default: `npm run build` is fine too).

6. **Environment Variables (Crucial):**

- Expand the **"Environment Variables"** section.
- Add `OPENAI_API_KEY` = `sk-...` (Recommended for AI features, though core search can run without it).
- Add `NEXT_PUBLIC_SUPABASE_URL` = `https://...` (Your Supabase Project URL).
- Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...` (Your Supabase Publishable Key).
- _Reason:_ The build process may check environment variable types.

7. **Deploy:** Click **"Deploy"**.

8. **Data Integrity Check (Mandatory):**
   After any data migration or deployment, run this script locally to ensure the database is healthy:

```bash
npm run db:verify
```

_Expect " Verification PASSED"_

## 3. Database Indexing (Zero-Downtime)

To ensure zero-downtime when creating indexes on large tables, use the provided concurrent indexing script:

1. **Access Supabase SQL Editor** or CLI.
2. **Run the Script:**
   ```bash
   supabase db execute < supabase/scripts/create-indexes-concurrently.sql
   ```
   _Note: Creating indexes CONCURRENTLY can take several minutes but will not lock your tables._

## 4. Post-Deployment Verification

- Visit the URL provided by the legacy Vercel deployment (for example, `helpbridge-ca.vercel.app`).
- **Test Search:** Type "Food".
- _Success:_ Results appear instantly.
- **Test Semantic Search:** Type "I feel empty".
- _Success:_ The "Lightning Bolt" appears after ~10s, and results appear.

## 4. Troubleshooting

- **Build Fail:** Check Vercel logs. If it says "Module not found", ensure `app/worker.ts` and `hooks` are committed.
- **No Lightning Bolt:** Open Browser Console (F12). Look for network errors fetching the `.onnx` model file.
