---
status: stable
last_updated: 2026-01-23
owner: jer
tags: [pwa, offline, workbox, caching, privacy]
---

# ADR-010: PWA Offline Fallback, Public Export, and Workbox Caching

**Date:** 2026-01-22  
**Status:** Accepted  
**Context:** v17.6 PWA enhancement for installability + offline-first usability across 7 locales.

## Decision

1. **Stable navigation fallback URL**
   - Use Workbox navigation fallback `fallbacks.document = "/offline"` in `next.config.ts`.
   - Rewrite `/offline` → `/{locale}/offline` in `middleware.ts` using the user’s `NEXT_LOCALE` (or default locale).
   - Ensure `next-intl` message loading uses the route locale (e.g. `getMessages({ locale })` in `app/[locale]/layout.tsx`) so rewritten routes render the correct language.

2. **Public offline export endpoint (sanitized)**
   - Serve offline bootstrap data from `GET /api/v1/services/export`.
   - The export response must **omit internal/admin-only fields** (e.g., `admin_notes`, review metadata, org IDs).
   - Embeddings are shipped as a separate array to match IndexedDB storage patterns.

3. **Workbox caching strategy (privacy-preserving)**
   - Cache `/_next/static/**` aggressively (immutable build artifacts).
   - Cache install assets (`/manifest.json`, `/icons/**`, `/screenshots/**`) with `CacheFirst`.
   - Use `NetworkFirst` for `/api/v1/services/export` so data stays fresh when online but remains usable offline.
   - Avoid caching auth-protected/dashboard responses.

4. **Custom service worker scope**
   - Keep `public/custom-sw.js` limited to push notification UX (no `fetch` handlers).
   - Notification `actions` should be supplied by the push payload to support multi-lingual titles; avoid hardcoded UI strings in the SW.

5. **Operational health (no tracking)**
   - `GET /api/health` includes a `pwa` block verifying presence of the manifest, icons, screenshots, and SW scripts.
   - This enables monitoring without user identifiers.

## Rationale

- **Multi-lingual offline**: `/offline` must resolve deterministically while still rendering locale-aware content.
- **Governance + privacy**: Offline bootstrap is public by nature; it must not leak internal/admin fields.
- **Maintainability**: Workbox handles caching; custom SW is kept minimal to prevent conflicts with generated SW logic.

## Consequences

- `/api/v1/services/export` becomes a public interface and must remain sanitized as the `Service` type evolves.
- Locale switching can affect the cached `/offline` response; the caching strategy and app pre-warming should minimize stale-language scenarios.

## Related

- `docs/planning/archive/2026-01-17-v17-6-pwa-enhancement.md`
- `docs/runbooks/pwa-testing.md`
- `next.config.ts`
- `middleware.ts`
- `app/api/v1/services/export/route.ts`
