// Service Worker for Push Notifications
// This is a basic implementation - full Web Push API integration requires VAPID keys

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "NextBestMove";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/icon-192x192.png",
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Handle notification click - navigate to app
  const urlToOpen = event.notification.data?.url || "/app";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

