// Tiny key-value layer. Uses Upstash Redis (free tier) when
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, so limits and
// caches are shared across serverless instances. Otherwise falls back to
// per-instance memory, which is best-effort only.
import { env } from "./env";

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

const hasUpstash = () => Boolean(env.upstashUrl() && env.upstashToken());

async function upstash(commands: (string | number)[][]): Promise<unknown[] | null> {
  try {
    const res = await fetch(`${env.upstashUrl()}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.upstashToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: unknown }[];
    return data.map((d) => d.result);
  } catch {
    return null;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  if (hasUpstash()) {
    const r = await upstash([["GET", key]]);
    if (r) return (r[0] as string | null) ?? null;
  }
  return memGet(key);
}

export async function kvSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (hasUpstash()) {
    const r = await upstash([["SET", key, value, "EX", ttlSeconds]]);
    if (r) return;
  }
  memSweep();
  mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

/** Increments a counter that expires after ttlSeconds. Returns the new count. */
export async function kvIncr(key: string, ttlSeconds: number): Promise<number> {
  if (hasUpstash()) {
    const r = await upstash([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds, "NX"],
    ]);
    if (r) return Number(r[0]);
  }
  memSweep();
  const cur = memGet(key);
  const next = (cur ? Number(cur) : 0) + 1;
  const existing = mem.get(key);
  mem.set(key, { value: String(next), expires: existing && cur ? existing.expires : Date.now() + ttlSeconds * 1000 });
  return next;
}
