// Gertrude's service worker: receive a push, show it, open the chat on tap. No caching of pages (the app is small and live).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Gertrude", { body: d.body || "", icon: "/icon-192.png", badge: "/badge-96.png", data: { url: d.url || "/" }, tag: "gertrude", renotify: true })); });
self.addEventListener("notificationclick", (e) => { e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ("focus" in c) { c.navigate(url); return c.focus(); } } return self.clients.openWindow(url); })); });
