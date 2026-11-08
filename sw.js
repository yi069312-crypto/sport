const CACHE = "kon-riyadi-v1";
const CORE = ["./", "./index.html", "./manifest.json", "./firebase-config.js", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // ملفات الموقع نفسه: الشبكة أولاً ثم الكاش (عشان التحديثات توصل)
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
        .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
    );
    return;
  }

  // الخطوط فقط: الكاش أولاً
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }))
    );
  }
  // أي حاجة تانية (Firebase، الترتيب، الذكاء الاصطناعي) تمر عادي بدون تدخل
});
