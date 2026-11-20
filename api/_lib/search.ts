import { env } from "./env";
import { kvGet, kvSet } from "./kv";

export type Source = { title: string; url: string; snippet: string };
export type SearchResult = {
  sources: Source[];
  answer?: string;
  /** Set when search was attempted but failed; shown to the user as a notice. */
  error?: string;
  cached?: boolean;
};

const CACHE_TTL = 10 * 60; // seconds
const SNIPPET_CHARS = 700;

// Short greetings / identity questions need no web lookup. Saves Tavily credits.
const SKIP_PATTERNS = [
  /^(hi+|hey+|hello+|yo|sup|hii+|namaste|kem cho|majama|kya haal|kaise ho|thanks?|thank you|ok(ay)?|bye)[\s!.?]*$/i,
  /\b(who (made|built|created|designed) you|your creator|tane kone|tujhe kisne|aapko kisne|tumhe kisne)\b/i,
];

export function shouldSkipSearch(query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return SKIP_PATTERNS.some((p) => p.test(q));
}

function normalise(q: string) {
  return q.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 400);
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function webSearch(
  rawQuery: string,
  opts: { deep?: boolean; maxResults?: number } = {},
): Promise<SearchResult> {
  const key = env.tavilyKey();
  if (!key) return { sources: [], error: "Web search is not configured (TAVILY_API_KEY missing)." };

  // Tavily rejects very long queries; keep the most recent part of the message.
  const query = rawQuery.length > 380 ? rawQuery.slice(-380) : rawQuery;
  const depth = opts.deep ? "advanced" : "basic";
  const maxResults = opts.maxResults ?? 5;
  const cacheKey = `search:${depth}:${maxResults}:${await sha(normalise(query))}`;

  const hit = await kvGet(cacheKey);
  if (hit) {
    try {
      return { ...(JSON.parse(hit) as SearchResult), cached: true };
    } catch {
      /* ignore corrupt cache */
    }
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query,
        search_depth: depth,
        max_results: maxResults,
        include_answer: opts.deep ? "basic" : false,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      const reason =
        res.status === 401
          ? "the search API key is invalid"
          : res.status === 429
            ? "the search service is rate limited"
            : res.status === 432 || res.status === 433
              ? "the monthly search quota is used up"
              : `the search service returned ${res.status}`;
      console.warn(`[mira] tavily ${res.status}`);
      return { sources: [], error: `Web search unavailable: ${reason}. Answering without live results.` };
    }

    const data = (await res.json()) as {
      answer?: string;
      results?: { title?: string; url: string; content?: string }[];
    };
    const result: SearchResult = {
      answer: data.answer || undefined,
      sources: (data.results || [])
        .filter((r) => r.url)
        .map((r) => ({
          title: (r.title || r.url).slice(0, 200),
          url: r.url,
          snippet: (r.content || "").replace(/\s+/g, " ").slice(0, SNIPPET_CHARS),
        })),
    };
    await kvSet(cacheKey, JSON.stringify(result), CACHE_TTL);
    return result;
  } catch (e) {
    console.warn("[mira] tavily failed", (e as Error)?.name);
    return { sources: [], error: "Web search timed out. Answering without live results." };
  }
}

/** Formats results as a context block; trimmed to fit a character budget. */
export function formatSearchContext(r: SearchResult, maxChars: number): string {
  if (!r.sources.length) return "";
  const today = new Date().toISOString().slice(0, 10);
  let out =
    `## Web search results (retrieved ${today})\n` +
    `Use these when relevant. They are more current than your training data. ` +
    `Cite sources inline as [n] matching the numbers below. ` +
    `If they don't answer the question, say so instead of guessing.\n\n`;
  if (r.answer) out += `Search summary: ${r.answer}\n\n`;
  r.sources.forEach((s, i) => {
    const block = `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.snippet}\n\n`;
    if (out.length + block.length <= maxChars) out += block;
  });
  return out.trim();
}

/** Tavily account usage, cached for 5 minutes. */
export async function tavilyUsage(): Promise<{ used: number; limit: number } | null> {
  const key = env.tavilyKey();
  if (!key) return null;
  const cached = await kvGet("tavily:usage");
  if (cached) return JSON.parse(cached);
  try {
    const res = await fetch("https://api.tavily.com/usage", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { account?: { plan_usage?: number; plan_limit?: number } };
    if (!d.account?.plan_limit) return null;
    const out = { used: d.account.plan_usage ?? 0, limit: d.account.plan_limit };
    await kvSet("tavily:usage", JSON.stringify(out), 300);
    return out;
  } catch {
    return null;
  }
}
