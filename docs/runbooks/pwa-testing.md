# Runbook: PWA & Mobile Infrastructure Testing

This runbook provides a step-by-step guide for manually verifying the Progressive Web App (PWA) features and mobile infrastructure introduced in v15.0.

## 1. Installation & Environment

### Prerequisites

- Build the app locally: `SKIP_EMBEDDINGS=1 npm run build`
- Start the server: `npm run start`
- Access via `localhost:3000` or via an HTTPS tunnel (e.g., ngrok) if testing on a physical mobile device.

### Browser Support

| Feature          | Chrome (Desktop/Android) |  Safari (iOS)  | Firefox |
| :--------------- | :----------------------: | :------------: | :-----: |
| Offline Cache    |            ✅            |       ✅       |   ✅    |
| Install Prompt   |            ✅            |  ⚠️ (Manual)   |   ✅    |
| Push (OneSignal) |            ✅            | ✅ (iOS 16.4+) |   ✅    |

---

## 2. Initial Data Sync

1. Open the app in a new incognito window.
2. Open DevTools > Network tab.
3. Refresh the page.
4. **Verify**: The browser should fetch `/api/v1/services/export`.
5. Open DevTools > Application > Cache Storage.
6. **Verify**: `services-export` cache exists (NetworkFirst; used for offline-friendly re-sync).
7. Open DevTools > Application > IndexedDB.
8. **Verify**: `helpbridge-offline-v1` database exists and the `services` store contains ~196 items.

---

## 2.1 PWA Asset Validation (Quick)

1. Open `http://localhost:3000/manifest.json` in the browser.
2. **Verify**: JSON loads (not a 404) and references `/icons/*` + `/screenshots/*`.
3. Open `http://localhost:3000/icons/icon-512.png`.
4. **Verify**: Image loads (not a 404).

---

## 3. Offline Search & Navigation

1. In DevTools > Network, set throttling to **Offline**.
2. Navigate to the Home page.
3. **Verify**: The "Offline Mode" banner appears at the top.
4. Perform a search (e.g., "food").
5. **Verify**: Search results are displayed (loaded from IndexedDB).
6. Click on a service.
7. **Verify**: The Service Detail page loads correctly.

---

## 4. Offline Feedback Queue

1. While still **Offline**, go to any service page.
2. Submit a "Helpful" vote or a "Report Issue" form.
3. **Verify**: A message appears saying "Your feedback will be synced when you are back online."
4. Open DevTools > Application > IndexedDB > `pendingFeedback`.
5. **Verify**: Your submission is queued in the store.
6. Set the Network back to **Online**.
7. **Verify**: After a few seconds, the item is removed from IndexedDB (check Console logs for "Syncing pending feedback").

---

## 4.1 Offline Fallback Route

1. While **Online**, open `http://localhost:3000/offline`.
2. **Verify**: It renders (this is the Workbox navigation fallback target).
3. Switch to **Offline** and refresh the page.
4. **Verify**: It still renders, and the language matches your locale preference (`NEXT_LOCALE`).

---

## 5. Push Notification Opt-In

1. Reset notification permissions for the site.
2. Navigate to the **Settings** page.
3. Locate the **Notifications** section.
4. Click **Enable**.
5. **Verify**: Browser permission prompt appears.
6. **Verify**: After allowing, the button changes to "Disable" and the status is "Active".
7. _Note: Actual push delivery requires `NEXT_PUBLIC_ONESIGNAL_APP_ID` to be configured._

---

## 6. Deep Linking (Placeholder Verification)

1. Verify that the following paths return the correct JSON content (or are served correctly):
   - `/.well-known/apple-app-site-association`
   - `/.well-known/assetlinks.json`
   - _Note: These are static files and don't require logic, just presence and correct structure._

---

## 7. Lighthouse PWA Audit (Release Verification)

> PWA is disabled in `dev` mode; audit a production build.

1. Build + start:
   - `SKIP_EMBEDDINGS=1 npm run build`
   - `npm run start`
2. Run Lighthouse:
   - `npx lighthouse http://localhost:3000/en --view`
3. **Verify**: PWA installability, manifest validity, and no service worker registration errors.

---

## 7.1 PWA Health Endpoint (Release/Monitoring)

This repo exposes a privacy-preserving health endpoint that also verifies PWA asset presence.

1. Open `http://localhost:3000/api/health`
2. **Verify**:
   - `status` is `"ok"`
   - `pwa.ok` is `true`
   - `pwa.assetsOk` is `true`
   - In production builds, `pwa.workboxOk` is `true`
   - `pwa.checks.manifest.exists` is `true`
   - `pwa.checks.customServiceWorker.exists` is `true`

This endpoint is safe to monitor externally (it does not require user identifiers).

---

## 8. Multi-Language Offline Check (All Locales)

For each locale: `/en`, `/fr`, `/zh-Hans`, `/ar`, `/pt`, `/es`, `/pa`

1. Load the locale route while online (e.g. `http://localhost:3000/ar`).
2. Switch to **Offline**.
3. Navigate to `http://localhost:3000/offline`.
4. **Verify**: Correct language renders; Arabic uses RTL (`<html dir="rtl">`).
5. Switch back **Online**.
6. **Verify**: Offline sync runs (watch Console logs and the `helpbridge-offline-v1` IndexedDB metadata).

---

## Troubleshooting

- **Database not updating**: Close all tabs of the app and reopen. IndexedDB migrations sometimes require a fresh start.
- **Service Worker not active**: Check DevTools > Application > Service Workers. Ensure it is "Activated and is running".
- **Offline banner not showing**: Ensure `useNetworkStatus` hook is correctly listening to `window.onoffline`.
