---
status: stable
last_updated: 2026-01-15
owner: jer
tags: [development, mobile, pwa]
---

# Mobile-Ready Infrastructure (v15.0)

This document outlines the mobile architecture, offline capabilities, and push notification infrastructure introduced in v15.0. It serves as the primary reference for developers working on the mobile aspect of Kingston Care Connect.

## Overview

v15.0 establishes the technical foundation for native mobile apps without requiring immediate native build processes (macOS/Xcode/Android Studio). This allows us to improve the PWA experience immediately while preparing for a smooth v15.1 launch.

### Key Features

- **Offline-First**: IndexedDB caching of all services and embeddings.
- **Push Notifications**: Web push support via OneSignal (native-ready).
- **Mobile-Optimized API**: Bulk export endpoints and deep linking configuration.

## Testing Offline Features

Since v15.0 does not include native app builds, testing is primarily done via the PWA in a browser.

1. Open the App: Navigate to `http://localhost:3000`.
2. Initial Sync: On the first visit, the app should download the full service directory (check Console or Network tab for `/api/v1/services/export`).
3. Go Offline:
   - Open DevTools > Network.
   - Set throttling to "Offline".
   - Navigate to the "Search" page.
4. Verify Behavior:
   - You should still be able to search for services.
   - Service detail pages should load (showing cached data).
   - An "Offline Mode" banner should appear.
   - Feedback submission should queue (check IndexedDB `pendingFeedback` store).

## Push Notifications Setup

We use OneSignal for push notifications.

### Prerequisites

- **OneSignal Account**: You need access to the KCC OneSignal dashboard.
- **Environment Variables**:
  - `ONESIGNAL_APP_ID`: The App ID from OneSignal project settings.
  - `ONESIGNAL_REST_API_KEY`: (Server-side only) For sending notifications.

### Web Push Testing

1. Ensure you are `localhost` or an HTTPS domain.
2. Wait for the "Get Service Updates?" prompt (or trigger it in Settings).
3. Allow notifications.
4. From the OneSignal dashboard (or KCC Admin), send a test message.
5. Verify the notification appears on your device/desktop.

## Capacitor Configuration

The project is configured with Capacitor 6.x.

- **Config File**: `capacitor.config.ts`
- **Native Platforms**: Android project is initialized in `android/` (ignored by git).
- **Initialization**:

  ```bash
  npx cap sync
  ```

## Deep Linking (v15.0 Preparation)

We have prepared the infrastructure for **Universal Links** (iOS) and **App Links** (Android). This allows the native app to open directly when a user clicks a `kingstoncareconnect.org` link.

### Association Files

The following files are hosted in the `public/.well-known/` directory:

1. **`apple-app-site-association`**: Used by iOS to verify app ownership.
2. **`assetlinks.json`**: Used by Android to verify app ownership.

### Placeholder Update (v15.1)

Currently, these files contain placeholders. When the native apps are generated in Phase 15.1, the following values must be updated:

- **iOS**: Replace `PLACEHOLDER_TEAM_ID` with the Apple Developer Team ID.
- **Android**: Replace `PLACEHOLDER_SHA256_FINGERPRINT` with the app's signing certificate SHA-256 fingerprint.

### Target URL Patterns

The following URL patterns are configured to open in the app:

- `/*/services/*` (Service information)
- `/*/search` (Search results)
- `/*/categories/*` (Service categories)
- `/*/about/*` (Project pages)
- `/*/settings` (User settings)
- `/` (Home page)

## v15.0 vs v15.1

- **v15.0 (Current)**:
  - Infrastructure only.
  - PWA enhancements (offline, web push).
  - No App Store deployment.
  - No macOS required.
- **v15.1 (Future)**:
  - Native iOS/Android builds.
  - App Store / Play Store submission.
  - Native-specific features (Splash screen, native share).
