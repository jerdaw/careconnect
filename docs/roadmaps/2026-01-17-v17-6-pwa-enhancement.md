---
status: in_progress
last_updated: 2026-01-22
owner: jer
tags: [roadmap, v17.6, pwa, offline, mobile]
---

# v17.6: PWA Enhancement

**Priority:** MEDIUM
**Estimated Effort:** 1-2 weeks (single developer)
**Dependencies:** v17.4 (i18n for offline locale), v17.5 (accessibility)
**Impact:** Improved app store discoverability, offline functionality, multi-language offline

## Executive Summary

Enhance Progressive Web App capabilities for better mobile experience and app store compatibility.

**Architecture reality (already implemented):**

- PWA is built with `@ducanh2912/next-pwa` (see `next.config.ts`).
- Offline fallback route exists at `app/[locale]/offline/page.tsx` and is referenced by Workbox fallback logic.
- Offline data + feedback syncing already runs client-side via `components/offline/OfflineSync.tsx`.
- Manual verification steps already exist in `docs/runbooks/pwa-testing.md` and `docs/development/mobile-ready.md`.

**Primary gaps (to fix in this version):**

- `public/manifest.json` icon URLs are not aligned with the actual icon files in `public/` (currently uses `/icon?w=...`).
- `public/custom-sw.js` references a default icon path that is not present in `public/`.
- Missing screenshots + complete icon set for store-quality install UX.

> [!NOTE]
> **Manifest JSON** must be valid JSON (no comments). Keep explanations in Markdown, not inline.

## Implementation Status (Snapshot: 2026-01-22)

Completed in code:

- Manifest metadata, shortcuts, and share target (`public/manifest.json`).
- Store icon set + screenshots exist in `public/icons/` and `public/screenshots/` (tests enforce required sizes).
- Share target endpoint (`app/api/v1/share/route.ts`).
- Offline navigation fallback resolves (`/offline` rewrites to `/{locale}/offline` via middleware).
- URL → state hydration (`app/[locale]/page.tsx` reads `?q`, `?category`, `?openNow`).
- Workbox caching rules updated in `next.config.ts` (offline fallback, static assets, export endpoint).
- Privacy-preserving monitoring (`GET /api/health` includes PWA checks).

Remaining manual verification (release checklist):

- Replace placeholder screenshots with real screenshots taken from a running app (must keep exact dimensions).
- Run Lighthouse PWA audit on a production build and confirm score targets.
- Validate install UX on real devices (Android Chrome, iOS Safari).

---

## Phase 1: PWA Manifest Enhancements (1-2 days)

### 1.1 Current Manifest Analysis

**File:** `public/manifest.json`

**Current state:**

```json
{
  "name": "Kingston Care Connect",
  "short_name": "KCC",
  "description": "Find community services in Kingston. Free, confidential, and instant.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon?w=192", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon?w=512", "sizes": "512x512", "type": "image/png" }
  ],
  "screenshots": []
}
```

### 1.2 Enhance Manifest with Metadata

**Modify:** `public/manifest.json`

```json
{
  "name": "Kingston Care Connect - Social Services Search",
  "short_name": "KCC",
  "description": "Find essential community services in Kingston. Free, confidential, and instant. Health, housing, crisis, financial, and more.",
  "start_url": "/",
  "id": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",

  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "categories": ["social", "reference", "medical", "lifestyle"],
  "screenshots": [
    {
      "src": "/screenshots/mobile-search.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Search for services on mobile"
    },
    {
      "src": "/screenshots/mobile-detail.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "View service details"
    },
    {
      "src": "/screenshots/tablet-search.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Search on tablet"
    }
  ],
  "icons": [
    {
      "src": "/icons/favicon-16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/icons/favicon-32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "share_target": {
    "action": "/api/v1/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  },
  "prefer_related_applications": false,
  "related_applications": [],
  "protocol_handlers": [],
  "shortcuts": [
    {
      "name": "Search Services",
      "short_name": "Search",
      "description": "Search for community services",
      "url": "/?q=",
      "icons": [
        {
          "src": "/icons/shortcut-search-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Crisis Resources",
      "short_name": "Crisis",
      "description": "Find crisis support immediately",
      "url": "/?category=Crisis",
      "icons": [
        {
          "src": "/icons/shortcut-crisis-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "My Dashboard",
      "short_name": "Dashboard",
      "description": "View your saved services",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/shortcut-dashboard-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

Notes:

- `start_url` stays `/` so `next-intl` middleware can select the correct locale prefix based on user preference.
- `shortcuts` and `share_target` require URL → state hydration on the home page (see Phase 3).
  - For offline support, `/offline` is a stable navigation fallback URL; middleware rewrites it to `/{locale}/offline`.

### 1.3 Create PWA Screenshots

**Required files:**

- [ ] `/public/screenshots/mobile-search.png` (540x720, PNG) — replace placeholder with real capture
- [ ] `/public/screenshots/mobile-detail.png` (540x720, PNG) — replace placeholder with real capture
- [ ] `/public/screenshots/tablet-search.png` (1280x720, PNG) — replace placeholder with real capture

**Process:**

1. Take screenshots from running app
2. Crop to exact sizes (use ImageMagick or similar)
3. Optimize PNG (70% quality minimum)
4. Store in `public/screenshots/`

### 1.4 Create Icon Set

**Required icons:**

- [x] `public/icons/favicon-16.png` (16×16)
- [x] `public/icons/favicon-32.png` (32×32)
- [x] `public/icons/apple-touch-icon.png` (180×180, iOS)
- [x] `public/icons/icon-192.png` (192×192)
- [x] `public/icons/icon-512.png` (512×512)
- [x] `public/icons/icon-maskable-192.png` (192×192, maskable)
- [x] `public/icons/icon-maskable-512.png` (512×512, maskable)
- [x] `public/icons/shortcut-search-96.png` (96×96)
- [x] `public/icons/shortcut-crisis-96.png` (96×96)
- [x] `public/icons/shortcut-dashboard-96.png` (96×96)
- [x] `public/icons/badge-72x72.png` (72×72, notification badge)

**Design requirements:**

- [ ] Logo on uniform background
- [ ] Maskable icons: Logo should be centered with safe area
- [ ] All formats: PNG, optimized
- [ ] Consistent branding

### 1.5 Implement Share Target Handler

**New file:** `app/api/v1/share/route.ts`

The `share_target` in manifest.json requires a server endpoint to handle shared content:

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = formData.get("title") as string | null
    const text = formData.get("text") as string | null
    const url = formData.get("url") as string | null

    // Redirect to search with shared content as query
    const searchQuery = text || title || url || ""

    // Redirect to Home with the shared content.
    // NOTE: Use 303 so the follow-up request is a GET.
    // Locale selection is handled by next-intl middleware on the redirected request.
    return NextResponse.redirect(new URL(`/?q=${encodeURIComponent(searchQuery)}`, request.url), 303)
  } catch (error) {
    // On error, redirect to home
    return NextResponse.redirect(new URL("/", request.url), 303)
  }
}
```

**Use case:** User shares text from another app → KCC opens with that text as search query.

### 1.6 Update HTML Meta Tags

**Modify:** `app/[locale]/layout.tsx`

```typescript
import { Metadata } from "next"

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KCC",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16" },
      { url: "/icons/favicon-32.png", sizes: "32x32" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
}
```

---

## Phase 2: Service Worker Enhancement (2 days)

> [!IMPORTANT]
> **Architecture Decision:** This project uses `@ducanh2912/next-pwa` which auto-generates service workers. Custom service worker logic must go in `public/custom-sw.js`; Workbox configuration goes in `next.config.ts`. **Do not modify auto-generated files.**

### 2.1 Current Service Worker

**File:** `public/custom-sw.js`

**Current capabilities:**

- Push notification handling only
- ~40 lines

### 2.2 Enhance Service Worker

**Modify:** `public/custom-sw.js`

```javascript
self.addEventListener("push", function (event) {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: data.actions || [
      { action: "explore", title: "View Details" },
      { action: "close", title: "Close" },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()

  if (event.action === "close") return

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const url = event.notification.data?.url || "/"
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
```

Notes:

- Avoid adding `fetch` handlers inside `custom-sw.js`; Workbox (via `next-pwa`) already handles offline routing via `fallbacks.document` and runtime caching in `next.config.ts`.
- Feedback/background sync already runs at the app layer (see `components/offline/OfflineSync.tsx`). Service Worker Background Sync is optional and should only be added if we need “sync without opening the app”.
- For multi-lingual UX, prefer sending localized `actions` from the push payload; the service worker should not hardcode UI strings per-locale.

### 2.3 Offline Page Route Handler

**Ensure:** `app/[locale]/offline/page.tsx` exists and renders correctly

With v17.4 changes, offline page should be:

- [ ] Locale-aware (correct language)
- [ ] RTL for Arabic
- [ ] Translatable content
- [ ] Works without network

---

## Phase 3: URL Hydration (Shortcuts + Share Target) (1 day)

The manifest `shortcuts` and `share_target` will only be useful if the Home page can hydrate initial state from the URL.

### 3.1 Home Page: Read URL Params → Search State

**Modify:** `app/[locale]/page.tsx` (or `hooks/useSearch.ts`)

- [ ] Parse `?q=` and set initial query
- [ ] Parse `?category=` and map to a valid `IntentCategory` value (e.g. `"Crisis"`)
- [ ] Optional: parse `?openNow=1`
- [ ] Ensure this runs client-side and does not fight with user typing (only apply on first mount / when params change)

### 3.2 Share Target: Redirect to URL Params

**Add:** `app/api/v1/share/route.ts`

- [ ] Accept `multipart/form-data` (title/text/url)
- [ ] Redirect (303) to `/?q=...` (middleware handles locale)

> [!NOTE]
> **Background Sync**: feedback + offline sync already auto-runs when the app is open and the network returns (see `components/offline/OfflineSync.tsx`). Service Worker Background Sync is a stretch goal and should only be added if we need syncing while the app is closed.

---

## Phase 4: PWA Caching Strategy (1 day)

### 4.1 Analyze Workbox Configuration

**File:** `next.config.ts`

**Current architecture notes:**

- `fallbacks.document` is set to `/offline` (Workbox navigation fallback).
- `workboxOptions.importScripts` loads `public/custom-sw.js`.
- `workboxOptions.runtimeCaching` exists, but the URL patterns should be reviewed to ensure they match the real API routes (`/api/v1/...`).

### 4.2 Verify Cache Strategies

> [!NOTE]
> **Custom cache strategies:** Modify `next.config.ts` Workbox configuration, NOT the generated service worker files.

**Verify:** Cache strategies optimal for:

- [ ] Offline fallback: `/offline` is available while offline
- [ ] Bulk export: `/api/v1/services/export` behaves NetworkFirst (fresh when online; usable offline)
- [ ] Avoid caching auth-protected dashboard routes/responses
- [ ] Static assets: `/_next/static/**` cached aggressively

---

## Phase 5: Testing & Verification (1 day)

### 5.1 PWA Lighthouse Audit

```bash
# PWA is disabled in dev mode; test in production build
npm run build
npm run start

# Audit PWA
npx lighthouse http://localhost:3000/ --view

# Run in CI
lighthouse http://production.com/en \
  --chrome-flags="--headless=new" \
  --output=json \
  > lighthouse-report.json
```

**Expected scores:**

- PWA score: 90+
- Performance: 80+
- Accessibility: 90+
- Best Practices: 80+
- SEO: 90+

### 5.2 Test Installation

**Chrome/Android:**

1. Open in Chrome
2. Three-dot menu → "Install app"
3. Choose to install
4. Verify home screen icon
5. Verify app opens in standalone mode

**Safari/iOS:**

1. Open in Safari
2. Share button → "Add to Home Screen"
3. Verify home screen icon
4. Verify app opens in fullscreen
5. Test offline access

### 5.3 Offline Functionality Test

1. **Online:** Load app, search for service
2. **Offline:**
   - [ ] Previously viewed services cached
   - [ ] Search still works (cached data)
   - [ ] Navigation doesn't crash
   - [ ] Shows correct language
   - [ ] Arabic displays RTL correctly
3. **Back Online:**
   - [ ] Queued feedback syncs
   - [ ] Fresh data loads
   - [ ] No data loss

See also: `docs/runbooks/pwa-testing.md` (authoritative manual checks).

### 5.4 Multi-Language Test (All 7 locales)

For each locale:

- [ ] Load `/en`, `/fr`, `/zh-Hans`, `/ar`, `/pt`, `/es`, `/pa`
- [ ] Go offline
- [ ] Verify offline page in correct language
- [ ] Return online and verify sync
- [ ] Arabic offline page shows RTL

---

## Phase 6: App Store Readiness (1 day)

### 6.1 Google Play Store PWA Listing

If planning mobile app store listing:

**Requirements:**

- [ ] 512x512 icon (with safe area for masking)
- [ ] Screenshots in required formats
- [ ] App description (translated)
- [ ] Privacy policy link
- [ ] Support email
- [ ] Manifest.json valid

**Process:**

1. Generate signed APK from PWA (e.g., using Bubblewrap)
2. Upload to Google Play Console
3. Fill metadata
4. Submit for review

**Reference:** `docs/development/mobile-ready.md` (mobile architecture + deep linking notes).  
Full store submission work is tracked under v15.1 (paused) in `docs/roadmaps/roadmap.md`.

### 6.2 App Store (iOS) PWA Listing

For iOS:

- [ ] Meta tags for homescreen (apple-touch-icon, apple-web-app-capable)
- [ ] Status bar color (apple-mobile-web-app-status-bar-style)
- [ ] Standalone display support
- [ ] Screenshots for app preview

**Note:** iOS doesn't install PWAs to home screen automatically; users must use "Add to Home Screen" menu.

---

## Phase 7: Documentation & Monitoring (1 day)

### 7.1 PWA Implementation Guide

Update existing docs instead of creating new:

- [ ] Ensure `docs/development/mobile-ready.md` reflects the current PWA config (manifest, icons, offline fallback)
- [ ] Ensure `docs/runbooks/pwa-testing.md` matches the updated manifest + icons

### 7.2 Monitoring PWA Health

**Monitoring constraints:** Maintain privacy-by-design (no user tracking for installs/usage).

Practical, privacy-preserving checks:

- [ ] Lighthouse checks as part of release verification
- [ ] Manual offline/online sync verification (runbook)
- [ ] Watch for service worker registration errors during QA (DevTools)

---

## Success Criteria

- [ ] Manifest passes validation (use webmanifest.app)
- [ ] Lighthouse PWA score: 90+
- [ ] Installation works on Android/iOS
- [ ] Offline mode works for all 7 locales
- [ ] Auto-sync on network restore works (app-layer sync via `components/offline/OfflineSync.tsx`)
- [ ] Service worker: no 404 on registration
- [ ] All icon sizes generated
- [ ] Screenshots optimized and visible
- [ ] Tests verify offline functionality

---

## File Changes Summary

| File                        | Change                            | Impact                  |
| --------------------------- | --------------------------------- | ----------------------- |
| `public/manifest.json`      | Enhanced metadata                 | App discovery           |
| `public/custom-sw.js`       | Notification icon + click routing | UX improvement          |
| `app/api/v1/share/route.ts` | **NEW** - Share target handler    | Enable sharing into app |
| `app/[locale]/layout.tsx`   | Add/align icon + meta tags        | iOS support             |
| `app/[locale]/offline/*`    | Already locale-aware              | Multi-language offline  |
| `app/[locale]/page.tsx`     | URL → state hydration             | Shortcuts/share work    |
| Icon files                  | Generate 7 sizes                  | Device compatibility    |
| Screenshots                 | Create 3 variants                 | App store               |

---

## Dependencies & Assumptions

- **Workbox** (via next-pwa): Already configured
- **Service Worker API**: Supported in all modern browsers
- **IndexedDB**: For offline storage (already implemented)
- **Background Sync API**: Optional (only needed if syncing while app is closed becomes a requirement)

---

## Post-Deployment Monitoring

1. Check manifest validity weekly
2. Monitor Lighthouse scores during release verification
3. Review sync success via logs/runbook (no user tracking)
4. Watch for service worker registration/import errors during QA

---

## Future Enhancements (v17.7+)

- [ ] Native app wrapper (Capacitor)
- [ ] App Store listing (iOS/Android)
- [ ] Push notification campaigns
- [ ] Advanced offline analytics
- [ ] Periodic background refresh
