/* Pro Level Cuts — service worker
   Network first (so your edits show up right away), cache as offline backup.
   Bump CACHE when you want installed copies to drop old files. */
const CACHE = 'plc-v1';
const ASSETS = [
  './', 'index.html', 'showcase.html', 'formatter.html', 'css/style.css',
  'js/core.js', 'js/vendor/mp4-muxer.min.js', 'js/fullscreen.js', 'js/showcase-fx.js', 'js/showcase-fold.js', 'js/showcase-p2p.js', 'js/vendor/peerjs.min.js', 'js/showcase.js', 'js/formatter.js', 'js/formatter-pro.js', 'js/fx-float.js',
  'js/tour.js', 'manifest.webmanifest', 'icons/logo.svg', 'icons/logo-lockup.svg', 'icons/logo-wordmark.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) => {
    const url = new URL(a, self.registration.scope);
    return fetch(url, { cache: 'no-cache' }).then((res) => { if (!res.ok) throw new Error(a + ' ' + res.status); return c.put(cacheKey(url), res); });
  }))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf('plc-') === 0 && k !== CACHE).map((k) => caches.delete(k))))   // only our own old copies — other sites on this address keep theirs
      .then(() => self.clients.claim())
  );
});

// Network first with a short wait: a weak signal falls back after ~3 s to the
// saved copy of exactly this version (so new pages never mix with old scripts);
// no network at all falls back to any saved copy, so the app always opens offline.
const NET_WAIT_MS = 3000;
function cacheKey(url) { const u = new URL(url); u.searchParams.delete('ts'); u.hash = ''; return u.href; }

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.headers.has('range')) return;          // media range requests go straight through

  // 'no-cache' revalidates with GitHub Pages every time, so a reload always gets
  // the newest site files. (Page navigations can't be re-created with options,
  // so fetch their URL.)
  const network = (req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' }))
    .then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(cacheKey(url), copy)).catch(() => {});
      }
      return res;
    });
  const exact = () => caches.match(cacheKey(url));
  const anyCopy = () => exact().then((hit) => hit || caches.match(req, { ignoreSearch: true }))
    .then((hit) => hit || (req.mode === 'navigate' ? caches.match(new URL('index.html', self.registration.scope).href) : undefined));

  e.respondWith(new Promise((resolve) => {
    let settled = false;
    const finish = (res) => { if (!settled && res) { settled = true; resolve(res); } };
    const timer = setTimeout(() => { exact().then(finish); }, NET_WAIT_MS);
    network.then((res) => { clearTimeout(timer); finish(res); }, () => {
      clearTimeout(timer);
      anyCopy().then((res) => { if (!settled) { settled = true; resolve(res || Response.error()); } });
    });
  }));
  e.waitUntil(network.catch(() => {}));   // keep refreshing the saved copy in the background
});
