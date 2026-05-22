// Kundai OCR — Service Worker
// Handles installability, basic fetch passthrough, and Background Sync
// for the offline upload outbox (Phase 6).

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Only intercept same-origin requests. Cross-origin fetches (e.g. API calls to
// the backend) must go directly to the network so that CORS headers and
// credentials cookies are handled correctly by the browser, not the SW.
self.addEventListener('fetch', e => {
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // No caching strategy yet — just pass through (Phase 6 offline outbox uses IndexedDB).
  e.respondWith(fetch(e.request));
});

// ── Background Sync ───────────────────────────────────────────────────────────
// When connectivity is restored and the browser fires the 'sync' event, tell
// all open clients to drain their IndexedDB outbox. The actual upload logic
// lives in the client (outbox.ts) because the phone JWT and blobs are stored
// there; the SW just wakes them up.
self.addEventListener('sync', event => {
  if (event.tag === 'ocr-outbox-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'OCR_DRAIN_OUTBOX' }));
      })
    );
  }
});
