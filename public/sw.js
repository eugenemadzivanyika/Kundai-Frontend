// Kundai OCR — Service Worker
// Handles installability, basic fetch passthrough, and Background Sync
// for the offline upload outbox (Phase 6).

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Pass through all fetches — cache strategy is intentionally none for now
// (Phase 6 offline outbox uses IndexedDB, not the cache API).
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));

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
