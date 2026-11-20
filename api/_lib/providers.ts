import { ProviderId, providerKey } from "./env";
import { UserFacingError, sleep } from "./http";

export const PROVIDERS: Record<ProviderId, { label: string; base: string }> = {
  groq: { label: "Groq", base: "https://api.groq.com/openai/v1" },
  nvidia: { label: "NVIDIA", base: "https://integrate.api.nvidia.com/v1" },
};

export type ModelInfo = {
  id: string;
  provider: ProviderId;
  name: string;
  vendor: string;
  contextWindow?: number;
  isCode: boolean;
};

export type ProviderStatus = { ok: boolean; error?: string };

// Non-chat models (speech, embeddings, guards, classifiers, vision-only tools).
const NON_CHAT =
  /whisper|orpheus|tts|playai|guard|safeguard|safety|embed|retriever|rerank|clip|detector|calibration|reward|gliner|pii|translate|parse|ocr|cosmos|muse|synthetic|vlm-embed/i;
const CODE = /coder|codestral|devstral|starcoder|codellama|laguna|code/i;

// Preferred defaults / fallbacks, used only if present in the live list.
const PREFERRED: Record<ProviderId, string[]> = {
  groq: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
  nvidia: ["nvidia/nemotron-3.5-lightning-30b-a3b", "moonshotai/kimi-k3.1-pro", "nvidia/nemotron-3.5-super-vl-120b-a12b"],
};

function prettyName(id: string) {
  const base = id.includes("/") ? id.split("/").slice(1).join("/") : id;
  return base
    .split(/[-_]/)
    .map((p) => {
      if (/^\d+(\.\d+)?[bm]$/i.test(p)) return p.toUpperCase();
      if (/^(a\d+b)$/i.test(p)) return p.toUpperCase();
      if (/^(gpt|oss|vl|it|r1|glm)$/i.test(p)) return p.toUpperCase();
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}

type CacheEntry = { at: number; models: ModelInfo[]; status: ProviderStatus };
const modelCache = new Map<ProviderId, CacheEntry>();
const MODEL_TTL = 10 * 60_000;

async function fetchProviderModels(p: ProviderId): Promise<CacheEntry> {
  const key = providerKey(p);
  if (!key) return { at: Date.now(), models: [], status: { ok: false, error: "API key not configured" } };
  try {
    const res = await fetch(`${PROVIDERS[p].base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 || res.status === 403)
      return { at: Date.now(), models: [], status: { ok: false, error: "API key rejected" } };
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as {
      data: { id: string; active?: boolean; context_window?: number; owned_by?: string }[];
    };
    const models = data.data
      .filter((m) => m.active !== false && !NON_CHAT.test(m.id))
      .map<ModelInfo>((m) => ({
        id: m.id,
        provider: p,
        name: prettyName(m.id),
        vendor: m.id.includes("/") ? m.id.split("/")[0] : m.owned_by || PROVIDERS[p].label,
        contextWindow: m.context_window && m.context_window > 1024 ? m.context_window : undefined,
        isCode: CODE.test(m.id),
      }))
      .sort((a, b) => rank(p, a.id) - rank(p, b.id) || a.id.localeCompare(b.id));
    return { at: Date.now(), models, status: { ok: true } };
  } catch (e) {
    console.warn(`[mira] ${p} models failed`, (e as Error).message);
    return { at: Date.now(), models: [], status: { ok: false, error: "Model list unavailable" } };
  }
}

function rank(p: ProviderId, id: string) {
  const i = PREFERRED[p].indexOf(id);
  return i === -1 ? 99 : i;
}

export async function listModels(p: ProviderId): Promise<CacheEntry> {
  const hit = modelCache.get(p);
  if (hit && Date.now() - hit.at < (hit.status.ok ? MODEL_TTL : 30_000)) return hit;
  const fresh = await fetchProviderModels(p);
  // Keep a stale good list if the refresh failed.
  if (!fresh.status.ok && hit?.status.ok) return hit;
  modelCache.set(p, fresh);
  return fresh;
}

export async function pickFallback(p: ProviderId, exclude: string[]): Promise<string | null> {
  const { models } = await listModels(p);
  const ids = models.map((m) => m.id).filter((id) => !exclude.includes(id));
  return PREFERRED[p].find((id) => ids.includes(id)) || ids.find((id) => !CODE.test(id)) || ids[0] || null;
}

// ── Token budgets ─────────────────────────────────────────────────────────────
// Groq's free tier caps tokens per minute per model (8,000 at the time of
// writing) and counts max_tokens against it, so one request must fit inside it.
const tpmLimit = new Map<string, number>();

export function recordLimits(p: ProviderId, model: string, headers: Headers) {
  const lim = Number(headers.get("x-ratelimit-limit-tokens"));
  if (lim > 0) tpmLimit.set(`${p}:${model}`, lim);
}

export async function tokenCeiling(p: ProviderId, model: string): Promise<number> {
  const known = tpmLimit.get(`${p}:${model}`);
  const { models } = await listModels(p);
  const ctx = models.find((m) => m.id === model)?.contextWindow ?? 32_768;
  if (p === "groq") return Math.min(known ?? 8000, ctx);
  return Math.min(ctx, 32_768);
}

// ── Chat completion with retries ──────────────────────────────────────────────
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type CompletionOpts = {
  provider: ProviderId;
  model: string;
  messages: ChatMsg[];
  maxTokens: number;
  temperature?: number;
  stream: boolean;
  reasoningEffort?: "low" | "medium" | "high";
  signal?: AbortSignal;
  /** Longest Retry-After (seconds) worth waiting for on a 429. Default 3. */
  maxWaitSec?: number;
};

/** Classified upstream failure. `fallback` = worth trying another model. */
export class UpstreamError extends UserFacingError {
  fallback: boolean;
  constructor(message: string, status: number, code: string, fallback: boolean, retryAfter?: number) {
    super(message, status, code, retryAfter);
    this.fallback = fallback;
  }
}

function parseRetryAfter(h: Headers): number | undefined {
  const ra = h.get("retry-after");
  if (!ra) return undefined;
  const n = Number(ra);
  return Number.isFinite(n) ? Math.ceil(n) : undefined;
}

function classify(p: ProviderId, model: string, status: number, body: string, headers: Headers): UpstreamError {
  const label = PROVIDERS[p].label;
  const lower = body.toLowerCase();
  if (status === 401 || status === 403)
    return new UpstreamError(`The ${label} API key is invalid or has no access to this model.`, 502, "invalid_key", status === 403);
  if (status === 404 || /model_not_found|does not exist|decommissioned|not found|unknown model|not supported/.test(lower))
    return new UpstreamError(`The model "${model}" is not available on ${label} right now.`, 502, "model_unavailable", true);
  if (status === 413 || /request too large|context_length|maximum context|too many tokens/.test(lower))
    return new UpstreamError(
      `This conversation is too long for ${model} on the free tier. Start a new chat or pick a model with a bigger limit.`,
      413,
      "too_large",
      false,
    );
  if (status === 429) {
    const ra = parseRetryAfter(headers);
    const daily = /per day|tokens per day|requests per day|\(rpd\)|\(tpd\)|quota/.test(lower);
    return new UpstreamError(
      daily
        ? `${label}'s daily free quota for ${model} is used up. Pick another model or try again tomorrow.`
        : `${label} rate limit reached for ${model}.${ra ? ` Try again in ${ra}s,` : ""} or pick another model.`,
      429,
      daily ? "quota_exceeded" : "rate_limited",
      true,
      ra,
    );
  }
  if (status === 400)
    return new UpstreamError(`${label} rejected the request for ${model}.`, 502, "bad_request", true);
  return new UpstreamError(`${label} is having trouble (HTTP ${status}). Please try again.`, 502, "upstream_error", true);
}

/** AbortSignal.any() is not available in every edge runtime; small polyfill. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

const RETRYABLE = new Set([500, 502, 503, 504, 520, 522, 524]);

/**
 * Calls the provider. Retries transient failures (5xx, network, timeouts, and
 * 429s with a short Retry-After) with exponential backoff. Returns the raw
 * Response once headers arrive.
 */
export async function complete(o: CompletionOpts): Promise<Response> {
  const key = providerKey(o.provider);
  if (!key)
    throw new UpstreamError(`${PROVIDERS[o.provider].label} is not configured on the server.`, 503, "provider_missing", false);

  const body: Record<string, unknown> = {
    model: o.model,
    messages: o.messages,
    max_tokens: o.maxTokens,
    temperature: o.temperature ?? 0.6,
    stream: o.stream,
  };
  if (o.stream && o.provider === "groq") body.stream_options = { include_usage: true };
  if (o.reasoningEffort && /gpt-oss/.test(o.model)) body.reasoning_effort = o.reasoningEffort;

  const maxAttempts = 3;
  let lastErr: UpstreamError | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (o.signal?.aborted) throw new UpstreamError("Request cancelled.", 499, "aborted", false);
    try {
      const timeout = AbortSignal.timeout(o.stream ? 30_000 : 90_000);
      const signal = o.signal ? anySignal([o.signal, timeout]) : timeout;
      const res = await fetch(`${PROVIDERS[o.provider].base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal,
      });
      recordLimits(o.provider, o.model, res.headers);
      if (res.ok) return res;

      const text = await res.text().catch(() => "");
      console.warn(`[mira] ${o.provider}/${o.model} -> ${res.status}`);
      const err = classify(o.provider, o.model, res.status, text, res.headers);
      lastErr = err;
      const shortWait = res.status === 429 && err.code === "rate_limited" && (err.retryAfter ?? 99) <= (o.maxWaitSec ?? 3);
      if (!(RETRYABLE.has(res.status) || shortWait)) throw err;
      await sleep(shortWait ? (err.retryAfter! + 0.2) * 1000 : 400 * 3 ** attempt);
    } catch (e) {
      if (e instanceof UpstreamError) throw e;
      if (o.signal?.aborted) throw new UpstreamError("Request cancelled.", 499, "aborted", false);
      const isTimeout = (e as Error)?.name === "TimeoutError";
      lastErr = new UpstreamError(
        isTimeout
          ? `${PROVIDERS[o.provider].label} took too long to respond.`
          : `Could not reach ${PROVIDERS[o.provider].label}.`,
        504,
        isTimeout ? "timeout" : "network",
        true,
      );
      await sleep(400 * 3 ** attempt);
    }
  }
  throw lastErr ?? new UpstreamError("Model request failed.", 502, "upstream_error", true);
}

// ── Streaming parser for OpenAI-compatible SSE ───────────────────────────────
export type StreamPart =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "usage"; prompt: number; completion: number }
  | { kind: "finish"; reason: string }
  | { kind: "error"; message: string };

export async function* readCompletionStream(res: Response, idleMs = 45_000): AsyncGenerator<StreamPart> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const idle = new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error("stream_idle")), idleMs);
      });
      const { done, value } = await Promise.race([reader.read(), idle]).finally(() => clearTimeout(timer));
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let j: {
          error?: { message?: string } | string;
          choices?: {
            delta?: { content?: string | null; reasoning?: string | null; reasoning_content?: string | null };
            finish_reason?: string | null;
          }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
          x_groq?: { usage?: { prompt_tokens?: number; completion_tokens?: number } };
        };
        try {
          j = JSON.parse(payload);
        } catch {
          continue;
        }
        if (j.error) {
          yield { kind: "error", message: typeof j.error === "string" ? j.error : j.error.message || "Model stream error" };
          continue;
        }
        const d = j.choices?.[0]?.delta;
        const r = d?.reasoning ?? d?.reasoning_content;
        if (r) yield { kind: "reasoning", text: r };
        if (d?.content) yield { kind: "text", text: d.content };
        const fr = j.choices?.[0]?.finish_reason;
        if (fr) yield { kind: "finish", reason: fr };
        const u = j.usage ?? j.x_groq?.usage;
        if (u?.prompt_tokens != null)
          yield { kind: "usage", prompt: u.prompt_tokens, completion: u.completion_tokens ?? 0 };
      }
    }
  } catch (e) {
    if ((e as Error).message === "stream_idle") yield { kind: "error", message: "The model stopped responding mid-answer." };
    else throw e;
  } finally {
    reader.cancel().catch(() => {});
  }
}
