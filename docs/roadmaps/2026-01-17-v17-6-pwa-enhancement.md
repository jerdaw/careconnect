---
status: planned
last_updated: 2026-01-19
owner: jer
tags: [roadmap, v17.6, pwa, offline, mobile]
---

# v17.6: PWA Enhancement

**Priority:** MEDIUM
**Estimated Effort:** 1-2 weeks (single developer)
**Dependencies:** v17.4 (i18n for offline locale), v17.5 (accessibility)
**Impact:** Improved app store discoverability, offline functionality, multi-language offline

## Executive Summary

Enhance Progressive Web App capabilities for better mobile experience and app store compatibility. Currently has basic PWA config. Improvements include manifest enhancements, service worker improvements, and offline UX polish.

> [!NOTE]
> **JSON Examples**: The manifest.json examples below use comments for documentation purposes. Remove all comments before deploying as JSON does not support comments.

---

## Phase 1: PWA Manifest Enhancements (1-2 days)

### 1.1 Current Manifest Analysis

**File:** `public/manifest.json`

**Current state:**
```json
{
  "name": "Kingston Care Connect",
  "short_name": "KCC",
  "description": "Find community services in Kingston",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon?w=192", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon?w=512", "sizes": "512x512", "type": "image/png" }
  ],
  "screenshots": []  // EMPTY
}
```

### 1.2 Enhance Manifest with Metadata

**Modify:** `public/manifest.json`

```json
{
  "name": "Kingston Care Connect - Social Services Search",
  "short_name": "KCC",
  "description": "Find essential community services in Kingston. Free, confidential, and instant. Health, housing, crisis, financial, and more.",

  "start_url": "/en",  // Start in user's language preference
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",

  "background_color": "#ffffff",
  "theme_color": "#2563eb",

  // Categories for app store discovery
  "categories": [
    "productivity",
    "social",
    "reference",
    "lifestyle"
  ],

  // Screenshots for app store listings
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

  // Multiple icon sizes for different devices
  "icons": [
    {
      "src": "/favicon-16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/favicon-32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],

  // Share target (share FROM other apps into KCC)
  // NOTE: Requires implementing /api/v1/share endpoint (see Phase 1.6)
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

  // Preferred related applications (native apps if they exist)
  "prefer_related_applications": false,
  "related_applications": [],

  // Protocol handlers (if using custom protocols)
  "protocol_handlers": [],

  // Shortcuts for homescreen quick actions
  "shortcuts": [
    {
      "name": "Search Services",
      "short_name": "Search",
      "description": "Search for community services",
      "url": "/en?q=",
      "icons": [
        {
          "src": "/icon-search-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Crisis Resources",
      "short_name": "Crisis",
      "description": "Find crisis support immediately",
      "url": "/en?category=crisis",
      "icons": [
        {
          "src": "/icon-crisis-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "My Dashboard",
      "short_name": "Dashboard",
      "description": "View your saved services",
      "url": "/en/dashboard",
      "icons": [
        {
          "src": "/icon-dashboard-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

### 1.3 Create PWA Screenshots

**Required files:**
- [ ] `/public/screenshots/mobile-search.png` (540x720, PNG)
- [ ] `/public/screenshots/mobile-detail.png` (540x720, PNG)
- [ ] `/public/screenshots/tablet-search.png` (1280x720, PNG)

**Process:**
1. Take screenshots from running app
2. Crop to exact sizes (use ImageMagick or similar)
3. Optimize PNG (70% quality minimum)
4. Store in `public/screenshots/`

### 1.4 Create Icon Set

**Required icons:**
- [ ] `favicon-16.png` (16×16)
- [ ] `favicon-32.png` (32×32)
- [ ] `apple-touch-icon.png` (180×180, for iOS)
- [ ] `icon-192.png` (192×192)
- [ ] `icon-512.png` (512×512)
- [ ] `icon-maskable-192.png` (192×192, maskable format for dynamic colors)
- [ ] `icon-maskable-512.png` (512×512, maskable format)

**Design requirements:**
- [ ] Logo on uniform background
- [ ] Maskable icons: Logo should be centered with safe area
- [ ] All formats: PNG, optimized
- [ ] Consistent branding

### 1.5 Implement Share Target Handler

**New file:** `app/api/v1/share/route.ts`

The `share_target` in manifest.json requires a server endpoint to handle shared content:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const title = formData.get('title') as string | null
    const text = formData.get('text') as string | null
    const url = formData.get('url') as string | null

    // Redirect to search with shared content as query
    const searchQuery = text || title || url || ''
    const locale = request.headers.get('accept-language')?.split(',')[0] || 'en'

    // Redirect to search page with the shared content
    return NextResponse.redirect(
      new URL(`/${locale}?q=${encodeURIComponent(searchQuery)}`, request.url)
    )
  } catch (error) {
    // On error, redirect to home
    return NextResponse.redirect(new URL('/en', request.url))
  }
}
```

**Use case:** User shares text from another app → KCC opens with that text as search query.

### 1.6 Update HTML Meta Tags

**Modify:** `app/[locale]/layout.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kingston Care Connect',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16' },
      { url: '/favicon-32.png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
}
```

---

## Phase 2: Service Worker Enhancement (2 days)

### 2.1 Current Service Worker

**File:** `public/custom-sw.js`

**Current capabilities:**
- Push notification handling only
- ~40 lines

### 2.2 Enhance Service Worker

**Modify:** `public/custom-sw.js`

```javascript
// Handle push notifications (existing)
self.addEventListener('push', (event) => {
  const data = event.data.json()
  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    actions: data.actions || [],
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

// NEW: Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/en'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// NEW: Skip waiting (replace old service worker immediately)
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// NEW: Handle offline navigation to offline page
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept navigation requests
  if (request.mode !== 'navigate') {
    return
  }

  event.respondWith(
    fetch(request).catch(() => {
      // If offline and not already on offline page, serve offline page
      if (!url.pathname.endsWith('/offline')) {
        // Detect locale from pathname or default to 'en'
        const locale = url.pathname.split('/')[1] || 'en'
        return caches.match(`/${locale}/offline`)
      }
      return caches.match('/en/offline')
    })
  )
})

// NEW: Background sync for offline feedback
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncPendingFeedback())
  }
})

async function syncPendingFeedback() {
  try {
    const db = await openDatabase()
    const feedback = await db.getAll('pending_feedback')

    for (const item of feedback) {
      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      if (response.ok) {
        await db.delete('pending_feedback', item.id)
      }
    }
  } catch (error) {
    console.error('Sync failed:', error)
    throw error  // Retry sync
  }
}
```

### 2.3 Offline Page Route Handler

**Ensure:** `app/[locale]/offline/page.tsx` exists and renders correctly

With v17.4 changes, offline page should be:
- [ ] Locale-aware (correct language)
- [ ] RTL for Arabic
- [ ] Translatable content
- [ ] Works without network

---

## Phase 3: Background Sync Implementation (1-2 days)

### 3.1 Register Background Sync

**Modify:** `lib/offline/feedback.ts`

```typescript
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('sync-feedback')
      console.log('Background sync registered')
    } catch (error) {
      console.error('Failed to register sync:', error)
    }
  }
}
```

### 3.2 Trigger Sync After Feedback

**Modify:** `lib/actions/feedback.ts`

```typescript
export async function submitFeedback(feedback: Feedback) {
  // Try to submit
  const response = await fetch('/api/v1/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  })

  if (response.ok) {
    return { success: true }
  }

  // If offline, queue and register sync
  if (!navigator.onLine) {
    await queueFeedback(feedback)
    await registerBackgroundSync()
    return { queued: true, message: 'Will send when back online' }
  }

  // Network error
  throw new Error('Failed to submit feedback')
}
```

### 3.3 Periodic Sync (Optional, Stretch Goal)

**For future enhancement:** Refresh service data periodically when online

```typescript
// In service worker
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-services') {
    event.waitUntil(refreshServices())
  }
})

async function refreshServices() {
  const response = await fetch('/api/v1/services')
  const services = await response.json()

  // Update IndexedDB
  const db = await openDatabase()
  await db.put('services', { id: 'latest', data: services })
}
```

---

## Phase 4: PWA Caching Strategy (1 day)

### 4.1 Analyze Workbox Configuration

**File:** `next.config.ts`

**Current PWA config:**
```typescript
const withPWA = withPWAInit({
  dest: 'public',
  // ... other options
})
```

### 4.2 Verify Cache Strategies

Workbox automatically configures:

```typescript
// Static assets: Cache first (1 week TTL)
'/_next/static/**': 'CacheFirst',

// API calls: Network first with cache fallback
'/api/**': 'NetworkFirst',

// Images: Stale while revalidate (24h)
'/images/**': 'StaleWhileRevalidate',
```

**Verify:** Cache strategies optimal for:
- [ ] Services data: Fresh when online, cache when offline
- [ ] API responses: Recent data preferred, cache fallback
- [ ] Static assets: Cached aggressively

---

## Phase 5: Testing & Verification (1 day)

### 5.1 PWA Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit PWA
lighthouse http://localhost:3000/en --view

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

**Reference:** `docs/PLAY_STORE_GUIDE.md`

### 6.2 App Store (iOS) PWA Listing

For iOS:
- [ ] Meta tags for homescreen (apple-touch-icon, apple-web-app-capable)
- [ ] Status bar color (apple-mobile-web-app-status-bar-style)
- [ ] Standalone display support
- [ ] Screenshots for app preview

**Note:** iOS doesn't install PWAs to home screen automatically;  users must use "Add to Home Screen" menu.

---

## Phase 7: Documentation & Monitoring (1 day)

### 7.1 PWA Implementation Guide

**New file:** `docs/PWA_GUIDE.md`

```markdown
# PWA Implementation Guide

## What is a PWA?

A Progressive Web App is a web app that provides native app-like experience:
- Works offline
- Installable on home screen
- Smooth, app-like interface
- Fast loading

## Key Features

### 1. Service Worker
- Caches assets for offline access
- Handles push notifications
- Manages background sync

### 2. Web App Manifest
- Defines app metadata
- Specifies icons, screenshots
- Controls display mode

### 3. HTTPS
- Required for service workers
- Ensures security

## User Journey

1. User visits Kingston Care Connect
2. Browser prompts "Install app"
3. User installs to home screen
4. App opens in standalone mode
5. User works online and offline seamlessly
```

### 7.2 Monitoring PWA Health

**Track in analytics:**
- [ ] Installation rate
- [ ] Offline usage frequency
- [ ] Sync success rate
- [ ] Crash rate
- [ ] Cache hit rate

---

## Success Criteria

- [ ] Manifest passes validation (use webmanifest.app)
- [ ] Lighthouse PWA score: 90+
- [ ] Installation works on Android/iOS
- [ ] Offline mode works for all 7 locales
- [ ] Background sync functional
- [ ] Service worker: no 404 on registration
- [ ] All icon sizes generated
- [ ] Screenshots optimized and visible
- [ ] Tests verify offline functionality

---

## File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `public/manifest.json` | Enhanced metadata | App discovery |
| `public/custom-sw.js` | Background sync, offline handling | UX improvement |
| `app/api/v1/share/route.ts` | **NEW** - Share target handler | Enable sharing into app |
| `app/[locale]/layout.tsx` | Add PWA meta tags | iOS support |
| `app/[locale]/offline/*` | Already locale-aware | Multi-language offline |
| `lib/offline/feedback.ts` | Register background sync | Auto sync when online |
| Icon files | Generate 7 sizes | Device compatibility |
| Screenshots | Create 3 variants | App store |

---

## Dependencies & Assumptions

- **Workbox** (via next-pwa): Already configured
- **Service Worker API**: Supported in all modern browsers
- **IndexedDB**: For offline storage (already implemented)
- **Background Sync API**: Chrome/Edge, Firefox (partial)

---

## Post-Deployment Monitoring

1. Check manifest validity weekly
2. Monitor Lighthouse scores
3. Track installation rates
4. Review sync success rates
5. Monitor offline usage patterns

---

## Future Enhancements (v17.7+)

- [ ] Native app wrapper (Capacitor)
- [ ] App Store listing (iOS/Android)
- [ ] Push notification campaigns
- [ ] Advanced offline analytics
- [ ] Periodic background refresh
