self.addEventListener("push", function (event) {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
      url: data.url || "/",
    },
    actions: [
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
      // Check if there's already a window open with this URL
      const url = event.notification.data.url
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
