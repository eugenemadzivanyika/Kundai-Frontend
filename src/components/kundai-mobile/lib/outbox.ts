// IndexedDB upload outbox — queues page blobs when offline and drains them
// with exponential backoff once connectivity returns. The service worker
// registers a Background Sync tag ('ocr-outbox-sync') so uploads can
// complete even if the tab is closed.

const DB_NAME    = 'ocr-outbox';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

export interface OutboxEntry {
  id:        string;   // IDBKey
  sessionId: string;
  phoneJwt:  string;
  studentId: string | null;
  pageIndex: number;
  blob:      Blob;
  addedAt:   number;   // Date.now()
  attempts:  number;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function txn<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db    = await openDb();
  const tx    = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
    tx.onerror    = () => reject(tx.error);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function queuePage(
  entry: Omit<OutboxEntry, 'id' | 'addedAt' | 'attempts'>,
): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full: OutboxEntry = { ...entry, id, addedAt: Date.now(), attempts: 0 };
  await txn('readwrite', store => store.put(full));

  // Ask the service worker to schedule a Background Sync so this drains even
  // if the tab closes.
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore — SyncManager is not in all TS libs yet
      await reg.sync.register('ocr-outbox-sync');
    } catch {
      // SW not active yet — drain will happen in-tab on reconnect
    }
  }

  return id;
}

export async function getAllQueued(): Promise<OutboxEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result as OutboxEntry[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function removeEntry(id: string): Promise<void> {
  await txn('readwrite', store => store.delete(id));
}

async function bumpAttempts(entry: OutboxEntry): Promise<void> {
  await txn('readwrite', store => store.put({ ...entry, attempts: entry.attempts + 1 }));
}

// ── Drain ─────────────────────────────────────────────────────────────────────

const BASE_DELAY_MS = 2_000;
const MAX_ATTEMPTS  = 8;

type UploadFn = (blob: Blob, meta: { sessionId: string; phoneJwt: string; studentId: string | null; pageIndex: number }) => Promise<{ pageId: string; thumbUrl: string }>;

export type DrainResult =
  | { ok: true;  pageId: string; thumbUrl: string; entryId: string }
  | { ok: false; entryId: string; reason: string };

export async function drainQueue(uploadFn: UploadFn): Promise<DrainResult[]> {
  const entries = await getAllQueued();
  if (!entries.length) return [];

  const results: DrainResult[] = [];

  for (const entry of entries) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      // Give up — remove so the queue doesn't grow indefinitely
      await removeEntry(entry.id);
      results.push({ ok: false, entryId: entry.id, reason: 'max_attempts' });
      continue;
    }

    // Exponential backoff: don't retry too soon
    const backoffMs = BASE_DELAY_MS * 2 ** entry.attempts;
    const elapsed   = Date.now() - entry.addedAt;
    if (elapsed < backoffMs && entry.attempts > 0) {
      results.push({ ok: false, entryId: entry.id, reason: 'too_soon' });
      continue;
    }

    try {
      const result = await uploadFn(entry.blob, {
        sessionId: entry.sessionId,
        phoneJwt:  entry.phoneJwt,
        studentId: entry.studentId,
        pageIndex: entry.pageIndex,
      });
      await removeEntry(entry.id);
      results.push({ ok: true, pageId: result.pageId, thumbUrl: result.thumbUrl, entryId: entry.id });
    } catch {
      await bumpAttempts(entry);
      results.push({ ok: false, entryId: entry.id, reason: 'upload_failed' });
    }
  }

  return results;
}

// ── Online listener ───────────────────────────────────────────────────────────
// Call this once from the app root. Drains the queue whenever the browser
// reports connectivity restored.

export function registerOnlineListener(uploadFn: UploadFn, onDrained?: (results: DrainResult[]) => void): () => void {
  const handler = async () => {
    const results = await drainQueue(uploadFn);
    if (results.length) onDrained?.(results);
  };
  window.addEventListener('online', handler);
  // Also try immediately in case we're already online with a queued backlog
  handler();
  return () => window.removeEventListener('online', handler);
}
