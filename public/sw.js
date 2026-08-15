// The retired public surface uses a deliberately minimal update worker.
// Do not add precaching here: any failed precache request would prevent the
// activate event from clearing legacy directory data and transitioning open
// clients to the retirement page.
importScripts("/retirement-cleanup-sw-20260815.js")

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting())
})
