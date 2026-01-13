# v15.0: Mobile-Ready Infrastructure

> **Status**: In Planning
> **Roadmap Version**: v15.0
> **Last Updated**: 2026-01-13
> **Target Completion**: Q1 2026
> **Owner/Resourcing**: Solo dev + AI assistance (free-tier friendly)
> **Scope Guardrail**: Build infrastructure without requiring macOS or App Store accounts
> **Follow-Up**: v15.1 (Mobile App Launch) will handle actual App Store deployment

This document is the **version definition and implementation plan** for v15.0, which establishes the **technical foundation for native mobile apps** without requiring macOS access or App Store accounts. This enables immediate improvement to the PWA experience while preparing for future native app launch.

---

## 0) Executive Summary

### The Vision

Kingston Care Connect has achieved production-ready status (v14.x) with privacy-preserving feedback, equity-first access, and visible verification. However, significant access barriers remain:

1. **Offline Access**: Front-line workers in shelters/drop-in centres with poor connectivity cannot reliably access the directory
2. **Engagement**: No way to proactively notify users of critical service updates (shelter capacity, emergency closures)
3. **Future Mobile Readiness**: Technical debt would accumulate if we wait to prepare for native apps

v15.0 addresses these gaps by **building mobile-ready infrastructure** that:

- Improves the existing PWA immediately
- Prepares for native app launch when resources are available (v15.1)
- Requires zero macOS access or App Store accounts

### Three Pillars

1. **Offline-First Infrastructure**: Enable core directory search and service detail viewing without internet connectivity
2. **Push Notification Backend**: Build the server-side infrastructure for push notifications (testable via PWA)
3. **Mobile-Optimized API**: Create endpoints and data structures optimized for mobile performance

### Strategic Alignment

This roadmap positions KCC for:

- **Immediate PWA Improvement**: Better offline experience benefits users today
- **Technical Readiness**: When funding/resources allow, native app launch is straightforward
- **Resource Efficiency**: No wasted Apple Developer fees or macOS hardware until we're ready to launch

### What's In v15.0 (Mobile-Ready Infrastructure)

✅ **Included (No macOS Required)**:

- Capacitor configuration (structure only, Android testing optional)
- Next.js static export optimization
- Offline data infrastructure (IndexedDB, sync, caching)
- Network status detection and UI
- Push notification backend (OneSignal setup, admin panel)
- Deep linking configuration files (.well-known)
- Mobile-optimized API endpoints
- Share functionality preparation
- Enhanced PWA offline mode

❌ **Deferred to v15.1 (Requires macOS + App Store Accounts)**:

- iOS app builds and testing
- iOS App Store submission
- iOS-specific assets (app icons, splash screens)
- App Store metadata and screenshots
- TestFlight beta distribution
- Physical device testing on iOS

---

## 1) Goals / Non-Goals

### Goals (Must-Have for v15.0)

**Pillar 1: Offline-First Infrastructure**

1. Cache all 196 services and embeddings for offline search (IndexedDB)
2. Enable service detail viewing without network connectivity
3. Queue feedback submissions for sync when online (background sync)
4. Display clear offline/online status indicators to users
5. Implement automatic background data sync (< 24h staleness)

**Pillar 2: Push Notification Backend**

6. Set up OneSignal account and configure for web push
7. Build admin panel for sending push notifications
8. Test push notifications via PWA (no native app needed)
9. Create push notification registration flow
10. Document push notification infrastructure for future native app integration

**Pillar 3: Mobile-Optimized API**

11. Create `/api/v1/services/export` for bulk data download
12. Add deep linking configuration files (`.well-known/`)
13. Optimize API responses for mobile bandwidth
14. Prepare share functionality hooks (testable on web)
15. Document mobile-specific API contracts

### Non-Goals (Explicitly Out of Scope for v15.0)

- iOS app builds or Xcode configuration (requires macOS)
- iOS App Store submission or Apple Developer account
- iOS-specific testing or assets
- Google Play Store submission (can be done in v15.1 without macOS)
- Native app distribution of any kind
- Physical device testing (emulators/simulators only, or web testing)
- App Store metadata or screenshots
- Beta testing via TestFlight or Play Store

### Deferred to v15.1: Mobile App Launch

**v15.1 Prerequisites**:

- macOS access (for iOS builds)
- Apple Developer Program membership ($99/year)
- Google Play Developer account ($25 one-time)
- Testing devices or cloud testing service

**v15.1 will handle**:

- iOS and Android native builds
- App Store and Play Store submissions
- Platform-specific asset generation
- Native app testing and QA
- Public app launch

---

## 2) Current State Snapshot (v14.0 Baseline)

### What We Have

- **PWA Infrastructure**: `@ducanh2912/next-pwa` with service worker, offline fallback, and runtime caching
- **Push Notification Handler**: `public/custom-sw.js` with push event handling and notification click routing
- **Service Worker Caching**: Services API (24h StaleWhileRevalidate), JSON files (7d CacheFirst)
- **Responsive Design**: Mobile-first Tailwind CSS, tested on various screen sizes
- **196 Verified Services**: All with embeddings, ready for offline indexing
- **7 Locales**: Full internationalization support via next-intl

### What's Missing (v15.0 Will Add)

- **Proactive Offline Caching**: Current PWA caches network responses; we need proactive IndexedDB storage
- **Push Notification Backend**: Service worker handles push, but no registration flow or admin panel
- **Bulk Export API**: No endpoint for downloading all services at once
- **Network Status UI**: No clear indicators for offline mode
- **Background Sync**: Feedback submissions fail silently when offline

### Key Constraints

- **No macOS Access**: Cannot build or test iOS apps; focus on cross-platform infrastructure
- **No App Store Accounts**: Cannot submit apps; build backend and web-testable features
- **Free-Tier Friendly**: Must use free or self-hosted solutions
- **Solo Development**: Must be achievable with AI assistance, no team required
- **Privacy Compliance**: No new tracking or data collection

---

## 3) Target Architecture

### Conceptual Model

```
┌───────────────────────────────────────────────────────────────┐
│                    Kingston Care Connect                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐                          ┌─────────────┐     │
│  │   Web PWA   │ ◄─────v15.0──────────►   │  Future iOS │     │
│  │  (Enhanced) │                          │  App (v15.1)│     │
│  └──────┬──────┘                          └──────┬──────┘     │
│         │                                        │            │
│         └────────────────┬───────────────────────┘            │
│                          │                                    │
│                    ┌─────▼─────┐                              │
│                    │  Shared   │                              │
│                    │  Backend  │                              │
│                    │  (v15.0)  │                              │
│                    └─────┬─────┘                              │
│                          │                                    │
│         ┌────────────────┼────────────────┐                   │
│         │                │                │                   │
│   ┌─────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐           │
│   │  Offline  │   │    Push     │  │  Mobile API │           │
│   │   Data    │   │   Service   │  │  Endpoints  │           │
│   │ (IndexDB) │   │ (OneSignal) │  │  (Export)   │           │
│   └───────────┘   └─────────────┘  └─────────────┘           │
│                                                               │
│   ✅ Built in v15.0     🚀 Used by v15.1 native apps         │
└───────────────────────────────────────────────────────────────┘
```

### Offline Data Architecture

```
Data Flow: Online → Offline Cache → Search

┌─────────────────┐
│ App Launch      │
│ (PWA or future  │
│  native app)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Check: Is services.json in IndexedDB?   │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
    Yes                    No
      │                     │
      ▼                     ▼
┌─────────────┐    ┌─────────────────────┐
│ Load from   │    │ Fetch from network  │
│ IndexedDB   │    │ Cache to IndexedDB  │
└─────────────┘    └─────────────────────┘
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Search operates on in-memory data       │
│ (Same as current local mode)            │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Background: Check for updates           │
│ Compare version/timestamp               │
│ Download delta if stale (>24h)          │
└─────────────────────────────────────────┘
```

### Push Notification Flow (Web Push + Future Native)

```
Service Update Published → Push Sent → Device Receives → User Taps → Deep Link Opens

┌─────────────────┐
│ Admin publishes │
│ push via        │
│ Dashboard       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ OneSignal API                           │
│ Send to all subscribed users            │
│ (Web push now, native push in v15.1)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Device receives notification            │
│ Title: "Service Update"                 │
│ Body: "Kingston Shelter hours changed"  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ User taps notification                  │
│ Opens to service detail page            │
└─────────────────────────────────────────┘
```

---

## 4) Key Design Decisions

| Decision             | Recommendation                       | Rationale                                               | Alternatives Considered                                     |
| :------------------- | :----------------------------------- | :------------------------------------------------------ | :---------------------------------------------------------- |
| **Native wrapper**   | Capacitor 6.x (config only in v15.0) | Zero UI rewrite, config can be committed without builds | React Native (full rewrite), Flutter (new language)         |
| **Push service**     | OneSignal (free tier)                | 10k subscribers free, supports web push AND native      | Firebase FCM (Google dependency), self-hosted (complexity)  |
| **Offline storage**  | IndexedDB via `idb`                  | Already in project dependencies, good performance       | SQLite (requires native plugin), localStorage (size limits) |
| **Testing approach** | Web-based testing only for v15.0     | No macOS = no iOS testing; validate logic via PWA       | Emulators (requires macOS), cloud devices (costs)           |
| **Capacitor setup**  | Config + Android optional            | Android can be tested on Linux/Windows if desired       | Skip entirely until v15.1 (loses validation opportunity)    |
| **Build system**     | Defer to v15.1                       | GitHub Actions CI/CD not needed until native builds     | Set up now (premature, costs runner time)                   |

---

## 5) Technical Specifications

### 5.1 Capacitor Configuration (Structure Only)

**File**: `capacitor.config.ts`

```typescript
import { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "org.kingstoncareconnect.app",
  appName: "Kingston Care Connect",
  webDir: "out", // Next.js static export
  server: {
    // For development, point to local Next.js server
    url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined,
    cleartext: process.env.NODE_ENV === "development",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e3a5f", // KCC brand color
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}

export default config
```

**Note**: This file can be created and committed without building native apps. It serves as documentation for v15.1.

### 5.2 Offline Data Schema (IndexedDB)

**Database**: `kcc-offline-v1`

```typescript
interface OfflineDB {
  // Services store
  services: {
    key: string // service.id
    value: ServicePublic
    indexes: {
      "by-category": string
      "by-scope": string
      "by-updated": string // ISO timestamp
    }
  }

  // Embeddings store (for offline semantic search)
  embeddings: {
    key: string // service.id
    value: {
      id: string
      embedding: number[] // 384-dimensional vector
    }
  }

  // Metadata store
  meta: {
    key: "lastSync" | "version" | "servicesCount"
    value: string | number
  }

  // Pending feedback queue (for offline submissions)
  pendingFeedback: {
    key: string // UUID
    value: {
      type: "helpful_yes" | "helpful_no" | "issue" | "not_found"
      serviceId?: string
      message?: string
      categorySearched?: string
      createdAt: string // ISO timestamp
      syncAttempts: number
    }
  }
}
```

### 5.3 New API Endpoints

#### `GET /api/v1/services/export`

**Purpose**: Bulk export all services for offline caching

**Response** (JSON):

```jsonc
{
  "version": "2026-01-13T00:00:00Z",
  "count": 196,
  "services": [
    /* ServicePublic[] */
  ],
  "embeddings": [
    /* { id, embedding }[] */
  ]
}
```

**Headers**:

- `Cache-Control: public, max-age=86400` (24 hours)
- `ETag: "v-2026-01-13"`

**Conditional Request Support**:

- `If-None-Match: "v-2026-01-13"` → 304 Not Modified

### 5.4 Push Notification Payloads

**Service Update Notification**:

```jsonc
{
  "title": "Service Update",
  "body": "Kingston Food Bank hours have changed",
  "icon": "/icon-192x192.png",
  "data": {
    "type": "service_update",
    "serviceId": "kingston-food-bank",
    "url": "/en/services/kingston-food-bank"
  }
}
```

**Critical Alert Notification**:

```jsonc
{
  "title": "⚠️ Shelter Alert",
  "body": "Dawn House emergency shelter is at capacity",
  "icon": "/icon-192x192.png",
  "badge": "/badge-72x72.png",
  "data": {
    "type": "critical_alert",
    "serviceId": "dawn-house",
    "url": "/en/services/dawn-house",
    "priority": "high"
  }
}
```

### 5.5 Deep Linking Configuration (Web Preparation)

**iOS: apple-app-site-association** (hosted at `/.well-known/apple-app-site-association`):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.org.kingstoncareconnect.app",
        "paths": ["/*/services/*", "/*/search", "/*/categories/*"]
      }
    ]
  }
}
```

**Android: assetlinks.json** (hosted at `/.well-known/assetlinks.json`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.kingstoncareconnect.app",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

**Note**: These files can be created now. They won't break anything on the web and will be ready when native apps launch.

---

## 6) UX & Product Behavior

### 6.1 Enhanced PWA First Launch

**Flow**:

```
PWA Install → Data Download → Push Permission → Ready

┌─────────────────┐
│   App Opens     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       Offline Data Download             │
│   "Downloading service directory..."    │
│   [=========>          ] 45%            │
│   "This enables offline access"         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Push Notification Permission       │
│                                         │
│   "Stay informed about service updates" │
│                                         │
│   Get notified when:                    │
│   • Shelter capacity changes            │
│   • Service hours are updated           │
│   • New services are added              │
│                                         │
│   [Enable Notifications] [Not Now]      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            Home / Search                │
│   Ready to use (online or offline)      │
└─────────────────────────────────────────┘
```

### 6.2 Offline Mode Indicators

**Status Bar Component**:

```
┌─────────────────────────────────────────┐
│ ⚠️ Offline Mode                         │
│ Showing cached data from Jan 13, 2026   │
│ [Refresh when online]                   │
└─────────────────────────────────────────┘
```

**Search Results (Offline)**:

```
┌─────────────────────────────────────────┐
│ 🔍 Search: "food bank"                  │
│                                         │
│ ⚠️ Offline - showing cached results     │
│                                         │
│ [Result 1 - Kingston Food Bank]         │
│ [Result 2 - Partners in Mission]        │
│ ...                                     │
└─────────────────────────────────────────┘
```

### 6.3 Push Notification Opt-In (PWA)

**In-App Prompt**:

```
┌─────────────────────────────────────────┐
│                                         │
│   📢 Get Service Updates?               │
│                                         │
│   Receive notifications when:           │
│                                         │
│   ✓ Shelter capacity changes            │
│   ✓ Service hours are updated           │
│   ✓ Critical alerts are issued          │
│                                         │
│   We never send marketing messages.     │
│   You can turn this off anytime.        │
│                                         │
│   [Enable Notifications]                │
│   [Maybe Later]                         │
│                                         │
└─────────────────────────────────────────┘
```

**Settings Page Toggle**:

```
Settings > Notifications

┌─────────────────────────────────────────┐
│ Push Notifications                      │
│ ─────────────────────────────────────── │
│                                         │
│ Service Updates              [ON]       │
│ Get notified when service info changes  │
│                                         │
│ Critical Alerts              [ON]       │
│ Shelter capacity, emergencies           │
│                                         │
│ New Services                 [OFF]      │
│ When new services are added             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7) Implementation Plan (Sequential Phases)

### Phase 1 — Capacitor Configuration (Days 1-2)

**Objective**: Set up Capacitor structure without building native apps

**Deliverables**:

- [ ] Install Capacitor CLI and core packages
- [ ] Create `capacitor.config.ts` with app ID and settings
- [ ] Add `.gitignore` entries for future `ios/` and `android/` folders
- [ ] Document Capacitor setup in `docs/development/mobile-ready.md`
- [ ] **DO NOT** run `cap add ios` (requires macOS)
- [ ] **OPTIONAL**: Run `cap add android` if Android Studio available (testable on Linux/Windows)

**Commands**:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/splash-screen @capacitor/push-notifications
npm install @capacitor/app @capacitor/share @capacitor/status-bar
npm install @capacitor/network
npx cap init "Kingston Care Connect" org.kingstoncareconnect.app --web-dir=out
# DO NOT run: npx cap add ios (requires macOS)
# OPTIONAL: npx cap add android (if testing desired)
```

**Exit Criteria**:

- `capacitor.config.ts` created and committed
- Capacitor packages installed
- Documentation explains v15.0 vs v15.1 split

---

### Phase 2 — Offline Data Infrastructure (Days 3-10)

**Objective**: Enable full offline access to service directory

#### 2.1 IndexedDB Storage Layer

**Tasks**:

- [ ] Create `lib/offline/db.ts` using `idb` library
- [ ] Define schema: services, embeddings, meta, pendingFeedback
- [ ] Implement CRUD operations: `saveServices()`, `getServices()`, `getService(id)`
- [ ] Add version migration support for future schema changes
- [ ] Unit test all database operations

**Code Structure**:

```typescript
// lib/offline/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface KCCOfflineDB extends DBSchema {
  services: { key: string; value: ServicePublic; indexes: {...} };
  embeddings: { key: string; value: { id: string; embedding: number[] } };
  meta: { key: string; value: string | number };
  pendingFeedback: { key: string; value: PendingFeedback };
}

export async function getOfflineDB(): Promise<IDBPDatabase<KCCOfflineDB>>;
export async function saveAllServices(services: ServicePublic[]): Promise<void>;
export async function getAllServices(): Promise<ServicePublic[]>;
export async function getServiceById(id: string): Promise<ServicePublic | undefined>;
```

#### 2.2 Bulk Export API

**Tasks**:

- [ ] Implement `GET /api/v1/services/export` endpoint
- [ ] Include services and embeddings in response
- [ ] Add version/timestamp for cache validation
- [ ] Support conditional requests (`If-None-Match` / `ETag`)
- [ ] Add appropriate caching headers
- [ ] Test endpoint returns valid data

#### 2.3 Sync Manager

**Tasks**:

- [ ] Create `lib/offline/sync.ts` with sync orchestration
- [ ] Implement initial download on first visit
- [ ] Implement background sync check (every app resume)
- [ ] Add delta sync: Only download if version changed
- [ ] Handle sync failures gracefully (retry with backoff)
- [ ] Store last sync timestamp in IndexedDB

**Sync Strategy**:

```typescript
// lib/offline/sync.ts
export async function syncOfflineData(): Promise<SyncResult> {
  const lastSync = await getMeta("lastSync")
  const response = await fetch("/api/v1/services/export", {
    headers: lastSync ? { "If-None-Match": lastSync } : {},
  })

  if (response.status === 304) {
    return { status: "up-to-date", count: 0 }
  }

  const data = await response.json()
  await saveAllServices(data.services)
  await saveAllEmbeddings(data.embeddings)
  await setMeta("lastSync", data.version)

  return { status: "synced", count: data.count }
}
```

#### 2.4 Search Integration

**Tasks**:

- [ ] Modify `lib/search/data.ts` to check IndexedDB first
- [ ] Add `isOffline()` utility function
- [ ] Implement fallback: IndexedDB → Network → Error state
- [ ] Update search hooks to handle offline mode
- [ ] Test search works fully offline (disable network in DevTools)

**Exit Criteria**:

- PWA downloads all services on first visit
- Search works without network connectivity
- Service details viewable offline
- Sync detects and downloads updates when online

---

### Phase 3 — Offline UX Polish (Days 11-14)

**Objective**: Provide clear feedback about offline status and limitations

#### 3.1 Network Status Hook

**Tasks**:

- [ ] Create `hooks/useNetworkStatus.ts`
- [ ] Detect online/offline state using Navigator API
- [ ] Listen for network change events
- [ ] Integrate with Capacitor Network plugin (graceful fallback if not available)
- [ ] Expose: `{ isOnline, isOffline, lastOnline }`

#### 3.2 Offline Banner Component

**Tasks**:

- [ ] Create `components/ui/OfflineBanner.tsx`
- [ ] Display when offline: "Offline Mode - Showing cached data"
- [ ] Show last sync timestamp
- [ ] Add "Refresh when online" action
- [ ] Animate in/out smoothly
- [ ] Localize all strings

#### 3.3 Feature Degradation

**Tasks**:

- [ ] Disable feedback widget when offline (show message)
- [ ] Disable AI chat when offline (requires WebGPU + network)
- [ ] Show stale data warnings on service details
- [ ] Queue feedback submissions for later sync
- [ ] Test all degraded states

#### 3.4 Background Feedback Sync

**Tasks**:

- [ ] Store pending feedback in IndexedDB when offline
- [ ] Implement `syncPendingFeedback()` function
- [ ] Trigger sync when app comes online
- [ ] Retry failed submissions with exponential backoff
- [ ] Remove from queue after successful submission

**Exit Criteria**:

- Users clearly understand when they're offline
- All offline limitations are communicated
- Feedback submitted offline syncs when online

---

### Phase 4 — Push Notifications (Days 15-20)

**Objective**: Enable proactive communication for critical service updates (web push)

#### 4.1 OneSignal Integration

**Tasks**:

- [ ] Create OneSignal account (free tier: 10k subscribers)
- [ ] Configure web push settings (no native app config needed)
- [ ] Generate web push keys (VAPID)
- [ ] Install OneSignal Web SDK
- [ ] Test web push on desktop and mobile browsers

#### 4.2 Push Registration Flow

**Tasks**:

- [ ] Create `lib/push/registration.ts`
- [ ] Implement permission request flow
- [ ] Store subscription status locally (not sent to server)
- [ ] Add opt-in prompt component (`components/push/PushOptIn.tsx`)
- [ ] Trigger prompt after first successful search (engagement hook)
- [ ] Add settings page toggle for push preferences

#### 4.3 Push Handler

**Tasks**:

- [ ] Update `public/custom-sw.js` for OneSignal compatibility
- [ ] Handle notification tap → deep link routing
- [ ] Implement notification action buttons (View, Dismiss)
- [ ] Test notifications in browsers (Chrome, Firefox, Safari on desktop/mobile)

#### 4.4 Admin Push Console (Dashboard)

**Tasks**:

- [ ] Create `app/[locale]/admin/notifications/page.tsx`
- [ ] Build notification composer form:
  - Title, Body, URL
  - Target: All users (service-specific targeting in future)
  - Schedule: Now or later
- [ ] Integrate OneSignal REST API for sending
- [ ] Add audit log for sent notifications
- [ ] Implement rate limiting (max 5/day)

**Exit Criteria**:

- Users can opt-in to push notifications via PWA
- Notifications received in browsers that support web push
- Tapping notification opens correct service
- Admin can send notifications from dashboard
- Infrastructure ready for native app push in v15.1

---

### Phase 5 — Deep Linking Preparation (Days 21-23)

**Objective**: Prepare deep linking infrastructure for future native apps

#### 5.1 Universal Links / App Links Files

**Tasks**:

- [ ] Create `public/.well-known/apple-app-site-association`
- [ ] Create `public/.well-known/assetlinks.json`
- [ ] Configure Next.js to serve these files correctly
- [ ] Verify files accessible via web browser
- [ ] Document Team ID placeholder for v15.1

**Note**: These files won't affect web experience but will be ready when native apps launch.

#### 5.2 Share Functionality Preparation

**Tasks**:

- [ ] Add Share button to Service Detail page
- [ ] Use Web Share API (browser native)
- [ ] Share URL + service name as title
- [ ] Test on mobile browsers (Safari, Chrome Android)
- [ ] Add fallback for unsupported browsers (copy link)

#### 5.3 URL Routing Documentation

**Tasks**:

- [ ] Document URL patterns for deep linking in `docs/development/mobile-ready.md`
- [ ] Ensure all service detail URLs are shareable
- [ ] Test: Shared link opens correct page in browser

**URL Patterns**:

```
https://kingstoncareconnect.org/en/services/kingston-food-bank
→ Opens ServiceDetail(id: "kingston-food-bank", locale: "en")

https://kingstoncareconnect.org/fr/search?q=nourriture
→ Opens Search(query: "nourriture", locale: "fr")
```

**Exit Criteria**:

- `.well-known` files deployed and accessible
- Share button works via Web Share API
- URL structure documented for v15.1

---

### Phase 6 — Testing & Documentation (Days 24-28)

**Objective**: Comprehensive testing and documentation for handoff to v15.1

#### 6.1 Unit Tests

**Tasks**:

- [ ] Test IndexedDB operations (`lib/offline/db.ts`)
- [ ] Test sync logic (`lib/offline/sync.ts`)
- [ ] Test network status hook
- [ ] Test push registration logic
- [ ] Coverage target: 80% for new modules

#### 6.2 Integration Tests

**Tasks**:

- [ ] Test offline → online transition
- [ ] Test feedback sync queue
- [ ] Test push notification registration
- [ ] Test bulk export API

#### 6.3 PWA Testing Matrix

**Browsers to Test**:

| Platform | Browser         | Version | Push Support | Notes               |
| :------- | :-------------- | :------ | :----------- | :------------------ |
| Desktop  | Chrome          | Latest  | ✅ Yes       | Primary target      |
| Desktop  | Firefox         | Latest  | ✅ Yes       | Good support        |
| Desktop  | Safari          | Latest  | ⚠️ Limited   | Push on macOS 16+   |
| Mobile   | Chrome Android  | Latest  | ✅ Yes       | Best mobile support |
| Mobile   | Firefox Android | Latest  | ✅ Yes       | Good mobile support |
| Mobile   | Safari iOS      | Latest  | ⚠️ Limited   | Push on iOS 16.4+   |

**Test Scenarios**:

- [ ] Fresh visit → Data download completes
- [ ] Search while online → View detail
- [ ] Go offline (airplane mode) → Search works
- [ ] View service offline → Detail shows with stale warning
- [ ] Submit feedback offline → Queued message shown
- [ ] Go online → Feedback syncs
- [ ] Opt-in to push → Notification permission granted
- [ ] Receive push notification → Tap opens correct page
- [ ] Share service → Web Share API opens
- [ ] Test on slow 3G connection (throttle in DevTools)

#### 6.4 Documentation

**Tasks**:

- [ ] Create `docs/development/mobile-ready.md`:
  - What was built in v15.0
  - How to test offline features
  - Push notification setup instructions
  - What v15.1 will add
- [ ] Update `CLAUDE.md` with new architecture
- [ ] Document IndexedDB schema in ADR format
- [ ] Create runbook for admin push notifications

**Exit Criteria**:

- All unit and integration tests pass
- PWA tested on major browsers
- Offline mode works reliably
- Push notifications functional (where supported)
- Documentation complete for v15.1 handoff

---

## 8) Definition of Done (DoD)

v15.0 is considered "done" when:

**Pillar 1: Offline-First Infrastructure**

- [ ] All 196 services cached in IndexedDB on first visit
- [ ] Search works fully offline (keyword + category filters)
- [ ] Service details viewable offline with stale warnings
- [ ] Clear offline status indicators displayed
- [ ] Feedback queued offline, syncs when online
- [ ] Data refreshes automatically when online (≤24h staleness)

**Pillar 2: Push Notification Backend**

- [ ] OneSignal configured for web push
- [ ] Push opt-in flow functional in PWA
- [ ] Admin can send push notifications from dashboard
- [ ] Notifications work in supporting browsers
- [ ] Audit log tracks sent notifications
- [ ] Infrastructure documented for v15.1 native integration

**Pillar 3: Mobile-Optimized API**

- [ ] `/api/v1/services/export` endpoint functional
- [ ] `.well-known` files deployed for future deep linking
- [ ] Share button works via Web Share API
- [ ] API responses optimized for mobile bandwidth
- [ ] Mobile-specific contracts documented

**General**

- [ ] No regressions from v14.0 functionality
- [ ] All tests pass (unit, integration)
- [ ] PWA tested on major desktop and mobile browsers
- [ ] Documentation complete (`mobile-ready.md`)
- [ ] Clear handoff plan for v15.1 documented

**Explicitly NOT Done (Deferred to v15.1)**

- ❌ iOS app builds or testing
- ❌ Android app builds (optional in v15.0)
- ❌ App Store or Play Store submissions
- ❌ Native app assets (icons, splash screens for stores)
- ❌ Physical device testing on iOS
- ❌ macOS-dependent work

---

## 9) Risks & Mitigations

| Risk                                          | Impact | Likelihood | Mitigation                                                                                       |
| :-------------------------------------------- | :----- | :--------- | :----------------------------------------------------------------------------------------------- |
| **IndexedDB browser limits vary**             | Medium | Medium     | Test on multiple browsers; current data (~5MB) well within limits; monitor and prune if needed   |
| **Web push support inconsistent**             | Low    | High       | Accept limitation; focus on supported browsers (Chrome, Firefox, Safari 16.4+); document clearly |
| **Offline data staleness**                    | Medium | Low        | Implement automatic background sync; show last updated timestamp; allow manual refresh           |
| **OneSignal free tier limits**                | Medium | Low        | 10k subscribers generous for web push; upgrade or migrate if exceeded                            |
| **User confusion: PWA vs future native app**  | Low    | Medium     | Clear messaging: "Download our app when available"; manage expectations                          |
| **Capacitor config changes between versions** | Low    | Low        | Pin Capacitor version; document any breaking changes in v15.1                                    |

---

## 10) Success Metrics

### Quantitative (Measurable via Analytics)

1. **Offline Usage**: ≥ 15% of sessions use offline features
2. **Data Sync Success Rate**: ≥ 95% of sync attempts succeed
3. **Push Opt-In Rate**: ≥ 10% of PWA users enable notifications
4. **Offline Search Performance**: < 500ms search response time
5. **Feedback Sync Rate**: ≥ 90% of offline feedback syncs within 1 hour of going online

### Qualitative (User Feedback)

1. **Frontline Worker Feedback**: Positive responses from at least 2 shelters/organizations using offline mode
2. **User Testimonials**: At least 3 user comments about improved offline experience
3. **Partner Recognition**: Push notification admin panel used by at least 1 partner

### Strategic (v15.1 Readiness)

1. **Technical Debt**: Zero blockers for v15.1 native app launch
2. **Documentation Quality**: v15.1 implementer can start without asking questions
3. **Infrastructure Stability**: Offline and push systems run for 30 days without critical bugs

---

## 11) Open Questions (Resolve Before Implementation)

1. **OneSignal vs Self-Hosted**: Should we use OneSignal free tier or self-host push service?

   - **Recommendation**: OneSignal for simplicity; free tier sufficient for web push
   - **Note**: Can migrate to Firebase or self-hosted in v15.1 if needed

2. **Android Testing**: Should we test Android in v15.0 or wait for v15.1?

   - **Recommendation**: Optional—if Android Studio available, test to validate Capacitor setup
   - **Note**: Not required for v15.0 completion

3. **Push Notification Frequency**: How often should we send push notifications?

   - **Recommendation**: Max 1/day, only for critical updates (shelter capacity, emergency closures)
   - **Note**: Add rate limiting in admin console (5/day hard limit)

4. **Offline Data Size**: What if services grow beyond 5MB?

   - **Current**: 196 services + embeddings ≈ 5MB
   - **Recommendation**: Monitor and implement data pruning if >10MB
   - **Note**: Not a current concern

5. **Web Push Browser Support**: Should we require push support or make it optional?
   - **Recommendation**: Optional enhancement—graceful degradation if not supported
   - **Note**: Chrome/Firefox have excellent support; Safari improving

---

## 12) Handoff to v15.1: Mobile App Launch

### What v15.1 Will Do

**Prerequisites for v15.1**:

- macOS access (personal Mac, Mac mini, or GitHub Actions)
- Apple Developer Program ($99/year)
- Google Play Developer account ($25 one-time)

**v15.1 Scope**:

1. iOS app build and Xcode configuration
2. Android app build (if not done in v15.0)
3. App Store and Play Store asset generation
4. Native app testing (physical devices or cloud testing)
5. App Store and Play Store submissions
6. Public app launch and promotion
7. App Store Optimization (ASO)

**v15.1 Timeline**: Estimated 4-6 weeks after v15.0 completion

### Handoff Checklist

When v15.0 is complete, the following should be ready for v15.1:

- [ ] All backend infrastructure functional (offline, push, APIs)
- [ ] `capacitor.config.ts` created with correct app ID
- [ ] OneSignal configured and tested for web push
- [ ] `.well-known` files deployed for deep linking
- [ ] Documentation in `docs/development/mobile-ready.md` complete
- [ ] No outstanding bugs in offline or push systems
- [ ] Clear list of macOS-dependent tasks documented

---

## 13) Appendices

### Appendix A: Capacitor Plugin Reference

| Plugin                          | Purpose                   | When to Use         | v15.0 Status                |
| :------------------------------ | :------------------------ | :------------------ | :-------------------------- |
| `@capacitor/core`               | Core runtime              | Always              | ✅ Install                  |
| `@capacitor/splash-screen`      | Launch screen             | v15.1 (native apps) | ✅ Install (config only)    |
| `@capacitor/push-notifications` | Push notifications        | v15.1 (native push) | ✅ Install (prep for v15.1) |
| `@capacitor/app`                | App lifecycle, deep links | v15.1 (native apps) | ✅ Install (config only)    |
| `@capacitor/share`              | Native share sheet        | v15.1 (native apps) | ✅ Install (prep for v15.1) |
| `@capacitor/status-bar`         | Status bar styling        | v15.1 (native apps) | ✅ Install (config only)    |
| `@capacitor/network`            | Network status            | v15.0 (PWA now)     | ✅ Install and use          |

### Appendix B: File Structure Changes

```
kingston-care-connect/
├── capacitor.config.ts          # NEW: Capacitor configuration (structure only)
├── lib/
│   ├── offline/                 # NEW: Offline infrastructure
│   │   ├── db.ts               # IndexedDB wrapper
│   │   ├── sync.ts             # Sync orchestration
│   │   └── types.ts            # Offline types
│   └── push/                    # NEW: Push notification handling
│       ├── registration.ts     # Permission and registration
│       └── handler.ts          # Notification handling
├── hooks/
│   ├── useNetworkStatus.ts     # NEW: Online/offline detection
│   └── useOfflineData.ts       # NEW: Offline data access
├── components/
│   ├── ui/
│   │   └── OfflineBanner.tsx   # NEW: Offline status indicator
│   └── push/
│       └── PushOptIn.tsx       # NEW: Push notification prompt
├── app/
│   ├── api/v1/services/
│   │   └── export/
│   │       └── route.ts        # NEW: Bulk export endpoint
│   └── [locale]/admin/
│       └── notifications/
│           └── page.tsx        # NEW: Push notification admin console
├── public/
│   └── .well-known/            # NEW: Deep link verification files
│       ├── apple-app-site-association
│       └── assetlinks.json
└── docs/
    └── development/
        └── mobile-ready.md     # NEW: Mobile-ready infrastructure guide
```

### Appendix C: Environment Variables

```bash
# Mobile-specific (add to .env.local)
NEXT_PUBLIC_MOBILE_INFRASTRUCTURE=true  # Feature flag for offline/push
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key  # Server-side only
```

### Appendix D: Testing Checklist

```markdown
## v15.0 Testing Checklist

### Desktop Browsers

- [ ] Chrome (latest) - Fresh visit → Data downloads
- [ ] Chrome (latest) - Go offline → Search works
- [ ] Chrome (latest) - Push opt-in → Notification received
- [ ] Firefox (latest) - Same as Chrome tests
- [ ] Safari (latest) - Same as Chrome tests (push limited)

### Mobile Browsers

- [ ] Chrome Android - Offline search works
- [ ] Chrome Android - Push notification received
- [ ] Safari iOS - Offline search works
- [ ] Safari iOS - Push limited or unavailable (expected)

### Offline Scenarios

- [ ] Fresh visit online → Data downloads
- [ ] Go offline → Search "food" → Results display
- [ ] Offline → View service detail → Shows stale warning
- [ ] Offline → Submit feedback → Queued message
- [ ] Go online → Feedback syncs automatically

### Push Scenarios

- [ ] Opt-in prompt appears after first search
- [ ] User grants permission → Subscription successful
- [ ] Admin sends test notification → User receives
- [ ] Tap notification → Opens correct service page
- [ ] User opts out in settings → No more notifications

### Performance

- [ ] Offline search responds < 500ms
- [ ] Initial data download < 10 seconds on 3G
- [ ] IndexedDB storage < 10MB
- [ ] No memory leaks during extended offline use
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Next Review**: End of Phase 3 (Day 14)
**Status**: Ready for Implementation

---

## Sign-Off

**Solo Developer**: Ready to proceed with Phase 1 (Capacitor Configuration)
**Target Start Date**: When user explicitly requests v15.0 implementation
**Target Completion**: ~28 days from start

**Prerequisites**:

- ✅ No macOS required
- ✅ No App Store accounts required
- ✅ Can be done entirely on Linux/Windows

**Note**: This version is specifically scoped to avoid macOS dependencies. All work done in v15.0 will directly benefit the PWA experience while preparing infrastructure for v15.1 native app launch. When macOS access and App Store accounts are available, v15.1 can proceed with minimal additional infrastructure work.
