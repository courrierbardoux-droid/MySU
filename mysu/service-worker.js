const CACHE_NAME = 'mysu-v7';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './sheets.js',
  './gestures.js',
  './scanner.js',
  './clipboard.js',
  './ocr.js',
  './rules.js',
  './offline.js',
  './ui.js',
  './zxing.min.js',
  './tesseract.min.js',
  './tesseract-worker.min.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always go to network for Google APIs and auth scripts
  if (url.includes('googleapis.com') || url.includes('accounts.google.com') || url.includes('apis.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache first for app shell
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
