/* eslint-disable no-undef */
/**
 * PPA Tour service worker — push notifications, and a small offline shell.
 *
 * ⚠ SCOPE OF RISK. A service worker sits in front of every request on this
 * origin, and ppatour.com is a live marketing site. A worker that caches HTML
 * can serve a stale homepage to real visitors for days, and there is no way to
 * flush it from our side. So this one deliberately does the least it can:
 *
 *   · HTML is NEVER cached. Navigations go to the network, and only if the
 *     network fails does the fan see the offline card.
 *   · Only hashed build assets (/_next/static/*) and our own app icons are
 *     cached, and those URLs change whenever their content does.
 *   · Everything else — API routes, images, fonts from a CDN — is left alone.
 *
 * Registered from `components/app/RegisterServiceWorker.tsx`, only inside the
 * installed app, so a browser visitor never gets a worker at all.
 */
const VERSION = "ppa-v1";
const ASSETS = `${VERSION}-assets`;
const SHELL = `${VERSION}-shell`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll([OFFLINE_URL, "/app-icons/icon-192.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Immutable build output — safe to serve from cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app-icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages: network only. The cache is the fallback, never the source.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});

/**
 * A push arrives. The payload is written by `lib/push-send.ts`; anything
 * missing falls back to something honest rather than an empty notification.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Carvana PPA Tour";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/app-icons/icon-192.png",
      badge: "/app-icons/icon-192.png",
      tag: data.tag,
      // A second alert about the same match replaces the first instead of
      // stacking, but still buzzes — a fan following four pros during a
      // quarterfinal should not get a wall of notifications.
      renotify: Boolean(data.tag),
      data: { url: data.url || "/" },
    }),
  );
});

/** Tapping the notification focuses the app if it is open, else opens it. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
