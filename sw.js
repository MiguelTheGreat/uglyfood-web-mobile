const CACHE_NAME = 'uglyfood-v2.0.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/liquid-glass.css',
  './css/uglyfood.css',
  './js/uglyfood-data.js',
  './js/uglyfood-app.js',
  './assets/favicon.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/carrots.jpg',
  './assets/tomatoes.jpg',
  './assets/mangoes.jpg',
  './assets/eggplants.jpg',
  './assets/potatoes.jpg',
  './assets/bananas.jpg',
  './assets/peppers-squash.jpg',
  './assets/papaya-citrus.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
