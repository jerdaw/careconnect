# Runbook: PWA & Mobile Infrastructure Testing

This runbook provides a step-by-step guide for manually verifying the Progressive Web App (PWA) features and mobile infrastructure introduced in v15.0.

## 1. Installation & Environment

### Prerequisites

- Build the app locally: `npm run build`
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
5. Open DevTools > Application > IndexedDB.
6. **Verify**: `kcc-offline-v1` database exists and the `services` store contains ~196 items.

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

## Troubleshooting

- **Database not updating**: Close all tabs of the app and reopen. IndexedDB migrations sometimes require a fresh start.
- **Service Worker not active**: Check DevTools > Application > Service Workers. Ensure it is "Activated and is running".
- **Offline banner not showing**: Ensure `useNetworkStatus` hook is correctly listening to `window.onoffline`.
