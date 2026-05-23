import { App } from './core/App.js';

/**
 * Entry point. Builds and starts the App, then registers the service
 * worker for offline / installable PWA support.
 *
 * The app is exposed on window for debugging in DevTools (window.app).
 */
const app = new App({ userName: 'Mateo' });
app.start();
app.router.switchTab('home');

if (typeof window !== 'undefined') window.app = app;

// Register the service worker after the page has loaded so it never
// competes with the initial render. Wrapped in a try/catch because file://
// previews don't support service workers and we don't want a console error.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .catch((err) => console.info('[SW] not registered:', err.message));
  });
}
