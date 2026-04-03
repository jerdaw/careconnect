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
