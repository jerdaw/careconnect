# Deployment Guide: Kingston Care Connect (Vercel)

This project is optimized for deployment on **Vercel**.

## 1. Prerequisites
- A GitHub account (where this repo is pushed).
- A Vercel account (Free Tier is sufficient).
- Your `OPENAI_API_KEY` (Required for the build step).

## 2. Deploy Steps

1.  **Push Code:** Ensure your latest changes are pushed to GitHub `main` branch.
2.  **Login to Vercel:** Go to [vercel.com](https://vercel.com) and log in.
3.  **Add New Project:** Click **"Add New..."** -> **"Project"**.
4.  **Import Git Repository:** Select `kingston-care-connect`.
5.  **Configure Project:**
    -   **Framework Preset:** Next.js (Should auto-detect).
    -   **Root Directory:** `./` (Default).
    -   **Build Command:** `next build` (Default: `npm run build` is fine too).
6.  **Environment Variables (Crucial):**
    -   Expand the **"Environment Variables"** section.
    -   Add `OPENAI_API_KEY` = `sk-...` (Your key).
    -   Add `NEXT_PUBLIC_SUPABASE_URL` = `https://...` (Your Supabase Project URL).
    -   Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...` (Your Supabase Publishable Key).
    -   *Reason:* The build process runs `generate-embeddings.ts` (via the "Lazy" logic logic check) or simply needs the types to be valid. Even if using "Zero Cost", the build might strict check env vars.

7.  **Deploy:** Click **"Deploy"**.

8.  **Data Integrity Check (Mandatory):**
    After any data migration or deployment, run this script locally to ensure the database is healthy:
    ```bash
    npm run verify-db
    ```
    *Expect "🎉 Verification PASSED"*

## 3. Post-Deployment Verification
-   Visit the URL provided by Vercel (e.g., `kingston-care-connect.vercel.app`).
-   **Test Search:** Type "Food".
    -   *Success:* Results appear instantly.
-   **Test Semantic Search:** Type "I feel empty".
    -   *Success:* The "Lightning Bolt" ⚡ appears after ~10s, and results appear.

## 4. Troubleshooting
-   **Build Fail:** Check Vercel Logs. If it says "Module not found", ensure `app/worker.ts` and `hooks` are committed.
-   **No Lightning Bolt:** Open Browser Console (F12). Look for network errors fetching the `.onnx` model file.
