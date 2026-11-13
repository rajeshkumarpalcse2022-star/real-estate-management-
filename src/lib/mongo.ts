/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Frontend bridge to the MongoDB persistence API exposed by server.ts.
 *
 * The app keeps localStorage as an instant cache, and mirrors every write to
 * MongoDB through these helpers. Writes are debounced per collection so a
 * single user action that saves several lists does not flood the API.
 */

const SAVE_DEBOUNCE_MS = 300;

const pendingData = new Map<string, unknown>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
 
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

const dbUrl = (key: string) =>
  apiUrl(`/api/db/${encodeURIComponent(key)}`);

function sendSave(key: string, data: unknown, keepalive = false): Promise<void> {
  return fetch(dbUrl(key), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
    keepalive,
  }).then(() => undefined);
}

async function flushKey(key: string): Promise<void> {
  const timer = pendingTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingTimers.delete(key);
  }
  if (!pendingData.has(key)) return;
  const data = pendingData.get(key);
  pendingData.delete(key);
  try {
    await sendSave(key, data);
  } catch (err) {
    console.error(`[MongoDB] Failed to persist "${key}":`, err);
  }
}

/**
 * Queue a collection to be written to MongoDB. Repeated calls for the same
 * key within the debounce window are coalesced into a single request.
 */
export function queueMongoSave(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  pendingData.set(key, data);
  const existing = pendingTimers.get(key);
  if (existing) clearTimeout(existing);
  pendingTimers.set(key, setTimeout(() => { void flushKey(key); }, SAVE_DEBOUNCE_MS));
}

/** Force every queued write to be sent immediately. */
export async function flushMongoSaves(): Promise<void> {
  await Promise.all([...pendingData.keys()].map(flushKey));
}

/**
 * Fetch every collection from MongoDB. Returns null when the API is
 * unreachable so callers can fall back to localStorage data.
 */
export async function fetchAllMongoState(): Promise<Record<string, any> | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(apiUrl('/api/db'));
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json.data ? json.data : null;
  } catch (err) {
    console.warn('[MongoDB] Could not load state, using local cache:', err);
    return null;
  }
}

export interface MongoStatus {
  connected: boolean;
  driver?: string;
  database?: string;
  collections?: string[];
  count?: number;
  error?: string;
}

export async function fetchMongoStatus(): Promise<MongoStatus> {
  try {
    const res = await fetch(apiUrl('/api/mongodb/status'));
    return await res.json();
  } catch (err: any) {
    return { connected: false, error: err.message || 'Network error' };
  }
}

// Best-effort flush when the tab is closing or hidden.
if (typeof window !== 'undefined') {
  const flushOnHide = () => {
    for (const [key, data] of pendingData.entries()) {
      try {
        void sendSave(key, data, true);
      } catch {
        /* ignore */
      }
    }
    pendingData.clear();
    pendingTimers.forEach(timer => clearTimeout(timer));
    pendingTimers.clear();
  };
  window.addEventListener('pagehide', flushOnHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnHide();
  });
}
