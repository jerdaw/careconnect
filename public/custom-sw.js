const retirementCachePrefixes = [
  "services-api",
  "services-export",
  "start-url",
  "offline-fallback",
  "pwa-assets",
  "next-static",
  "next-image",
  "workbox-precache",
]
const retirementOfflineDatabases = ["careconnect-offline-v1", "helpbridge-offline-v1", "kcc-offline-v1"]
const retirementVectorDatabases = ["careconnect-vector-store", "helpbridge-vector-store"]
const retirementOfflineStores = ["services", "embeddings", "meta"]

function isRetirementCacheName(cacheName) {
  return retirementCachePrefixes.some(function (prefix) {
    return cacheName.startsWith(prefix)
  })
}

function clearRetirementOfflineDatabase(databaseName) {
  return new Promise(function (resolve) {
    const request = indexedDB.open(databaseName)

    request.onupgradeneeded = function () {
      // Do not create a database solely to clear it.
      if (request.transaction) request.transaction.abort()
    }
    request.onerror = function () {
      resolve(false)
    }
    request.onsuccess = function () {
      const database = request.result
      const stores = retirementOfflineStores.filter(function (storeName) {
        return database.objectStoreNames.contains(storeName)
      })

      if (stores.length === 0) {
        database.close()
        resolve(false)
        return
      }

      const transaction = database.transaction(stores, "readwrite")
      stores.forEach(function (storeName) {
        transaction.objectStore(storeName).clear()
      })

      function finish(cleared) {
        database.close()
        resolve(cleared)
      }
      transaction.oncomplete = function () {
        finish(true)
      }
      transaction.onerror = function () {
        finish(false)
      }
      transaction.onabort = function () {
        finish(false)
      }
    }
  })
}

function deleteRetirementDatabase(databaseName) {
  return new Promise(function (resolve) {
    const request = indexedDB.deleteDatabase(databaseName)
    request.onsuccess = function () {
      resolve(true)
    }
    request.onerror = function () {
      resolve(false)
    }
    request.onblocked = function () {
      resolve(false)
    }
  })
}

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.filter(isRetirementCacheName).map(function (cacheName) {
            return caches.delete(cacheName)
          })
        )
      }),
      Promise.all(retirementOfflineDatabases.map(clearRetirementOfflineDatabase)),
      Promise.all(retirementVectorDatabases.map(deleteRetirementDatabase)),
    ]).then(function () {
      return self.clients.claim()
    })
  )
})

self.addEventListener("push", function (event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json() || {}
  } catch {
    data = { body: event.data.text() }
  }

  const title = typeof data.title === "string" && data.title ? data.title : "CareConnect"
  const body = typeof data.body === "string" && data.body ? data.body : ""
  const url = typeof data.url === "string" && data.url ? data.url : "/"

  const actions = Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : undefined

  const options = {
    body,
    icon: typeof data.icon === "string" && data.icon ? data.icon : "/icons/icon-192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: { url },
    ...(actions ? { actions } : {}),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  if (event.action === "close") return

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/"
      const targetUrl = new URL(url, self.location.origin).href

      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) return client.focus()
      }

      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})
