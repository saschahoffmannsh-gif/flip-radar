// Hotflip Service Worker: App-Shell offline, API-Aufrufe nie aus dem Cache.
const CACHE = "fr-1793739820";
const SHELL = ["./", "index.html", "app.css?v=1793739820", "config.js?v=1793739820", "vendor/supabase.js?v=1793739820", "engine.js?v=1793739820", "mock.js?v=1793739820", "demo.js?v=1793739820", "app.js?v=1793739820", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "fonts/archivo-var.woff2", "fonts/permanent-marker.woff2", "fonts/courier-prime.woff2", "fonts/courier-prime-bold.woff2", "impressum.html", "datenschutz.html", "regeln.html", "legal.css?v=1793739820", "legal.js?v=1793739820"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith("version.json")) return;
  // Netz zuerst für HTML (immer aktuell), sonst Cache zuerst
  if (e.request.mode === "navigate") { e.respondWith(fetch(e.request).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))); return; }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return res; })));
});
