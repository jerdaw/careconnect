const retirementCachePrefixes = [
  "services-api",
  "services-export",
  "json-cache",
  "start-url",
  "offline-fallback",
  "pwa-assets",
  "next-static",
  "next-image",
  "workbox-precache",
]
const retirementOfflineDatabases = ["careconnect-offline-v1", "helpbridge-offline-v1", "kcc-offline-v1"]
const retirementVectorDatabases = ["careconnect-vector-store", "helpbridge-vector-store", "kcc-vector-store"]
const retirementOfflineStores = ["services", "embeddings", "meta"]
const retirementWorkboxExpirationDatabase = "workbox-expiration"
const retirementWorkboxExpirationStore = "cache-entries"
const retirementLocales = new Set(["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"])

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

function clearRetirementWorkboxMetadata() {
  return new Promise(function (resolve) {
    const request = indexedDB.open(retirementWorkboxExpirationDatabase)

    request.onupgradeneeded = function () {
      if (request.transaction) request.transaction.abort()
    }
    request.onerror = function () {
      resolve(0)
    }
    request.onsuccess = function () {
      const database = request.result
      if (!database.objectStoreNames.contains(retirementWorkboxExpirationStore)) {
        database.close()
        resolve(0)
        return
      }

      let deleted = 0
      const transaction = database.transaction(retirementWorkboxExpirationStore, "readwrite")
      const cursorRequest = transaction.objectStore(retirementWorkboxExpirationStore).openCursor()
      cursorRequest.onsuccess = function () {
        const cursor = cursorRequest.result
        if (!cursor) return

        const cacheName = cursor.value && cursor.value.cacheName
        if (typeof cacheName === "string" && isRetirementCacheName(cacheName)) {
          cursor.delete()
          deleted += 1
        }
        cursor.continue()
      }

      function finish(count) {
        database.close()
        resolve(count)
      }
      transaction.oncomplete = function () {
        finish(deleted)
      }
      transaction.onerror = function () {
        finish(0)
      }
      transaction.onabort = function () {
        finish(0)
      }
    }
  })
}

function retirementPathForClient(clientUrl) {
  const url = new URL(clientUrl)
  const firstSegment = url.pathname.split("/").filter(Boolean)[0]
  const locale = retirementLocales.has(firstSegment) ? firstSegment : "en"
  return new URL(`/${locale}/retired`, url.origin).href
}

function transitionOpenClients() {
  return self.clients
    .claim()
    .then(function () {
      return self.clients.matchAll({ type: "window", includeUncontrolled: true })
    })
    .then(function (clientList) {
      clientList.forEach(function (client) {
        // Do not await this promise from inside `activate`. Chromium may wait
        // for activation to finish before completing the navigation, which
        // would deadlock the retirement release. Once dispatched, the active
        // worker remains available to the controlled client through reload.
        client.navigate(retirementPathForClient(client.url)).catch(function () {
          return undefined
        })
      })
    })
    .then(function () {
      return self.registration.unregister()
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
      clearRetirementWorkboxMetadata(),
    ]).then(transitionOpenClients)
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
