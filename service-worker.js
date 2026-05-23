// Health Tracker — service worker.
// Strategy: precache the app shell on install, then network-first for
// the shell with a cache fallback. All data lives in localStorage and
// never crosses the network, so this SW only worries about the static
// assets.

const VERSION = 'ht-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './src/main.js',
  './src/core/App.js',
  './src/core/EventBus.js',
  './src/core/Store.js',
  './src/core/dateUtils.js',
  './src/core/dom.js',
  './src/data/defaults.js',
  './src/models/Body.js',
  './src/models/Exercise.js',
  './src/models/Nutrition.js',
  './src/models/Routine.js',
  './src/models/Workout.js',
  './src/repositories/BaseRepository.js',
  './src/repositories/repositories.js',
  './src/services/WorkoutSession.js',
  './src/services/calculators.js',
  './src/ui/components/ModalManager.js',
  './src/ui/components/Router.js',
  './src/ui/components/Toast.js',
  './src/ui/components/WeightChart.js',
  './src/ui/pages/ActiveWorkoutPage.js',
  './src/ui/pages/HomePage.js',
  './src/ui/pages/NutritionPage.js',
  './src/ui/pages/Page.js',
  './src/ui/pages/ProgressPage.js',
  './src/ui/pages/WorkoutPage.js',
  './public/icons/icon.svg',
  './public/icons/icon-192.png',
  './public/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      // Don't fail install if a single asset is missing.
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle same-origin GETs; Google Fonts etc. fall through to the network.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then((res) => {
      // Mirror successful responses into the cache.
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
