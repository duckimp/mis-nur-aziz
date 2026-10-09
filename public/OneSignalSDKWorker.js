// MIS Nur Aziz - PWA Service Worker
// Menggabungkan OneSignal SDK dengan caching PWA dasar

// ── OneSignal Push Notifications ──
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ── PWA Cache Strategy ──
const CACHE_NAME = 'mis-nur-aziz-v1';
const STATIC_ASSETS = [
  '/',
  '/ppdb',
  '/spmb',
  '/spmb/cek-status',
  '/manifest.json',
  '/images/logo.png',
];

// Install: pre-cache halaman penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Abaikan error jika ada asset yang gagal di-cache
      });
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network first, fallback ke cache
self.addEventListener('fetch', (event) => {
  // Hanya handle GET request, skip API calls
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response baru
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback ke cache jika offline
        return caches.match(event.request);
      })
  );
});