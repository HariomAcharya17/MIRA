// Tiny in-memory key-value store with expiry, used for rate limits and the
// search cache. State is per serverless instance, so limits are best-effort.

type Entry = { value: string; expires: number };
const mem = new Map<string, Entry>();

function memGet(key: string): string | null {
  const e = mem.get(key);
  if (!e) return null;
  if (e.expires < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.value;
}

function memSweep() {
  if (mem.size < 500) return;
  const now = Date.now();
  for (const [k, e] of mem) if (e.expires < now) mem.delete(k);
}

export async function kvGet(key: string): Promise<string | null> {
  return memGet(key);
}

export async function kvSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  memSweep();
  mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

/** Increments a counter that expires after ttlSeconds. Returns the new count. */
export async function kvIncr(key: string, ttlSeconds: number): Promise<number> {
  memSweep();
  const cur = memGet(key);
  const next = (cur ? Number(cur) : 0) + 1;
  const existing = mem.get(key);
  mem.set(key, { value: String(next), expires: existing && cur ? existing.expires : Date.now() + ttlSeconds * 1000 });
  return next;
}
