// Client for Mira's server routes. No API keys live here: the browser only
// talks to /api/*, and the server holds the provider keys.

export type ProviderId = "groq" | "nvidia";
export type Mode = "general" | "code" | "research" | "writer";

export type ModelInfo = {
  id: string;
  provider: ProviderId;
  name: string;
  vendor: string;
  contextWindow?: number;
  isCode: boolean;
};

export type ProviderStatus = { label: string; ok: boolean; error?: string };

export type ModelsResponse = {
  providers: Record<ProviderId, ProviderStatus>;
  models: ModelInfo[];
};

export type Source = { title: string; url: string };
export type ProjectFile = { path: string; content: string };

export type UsageEvent = {
  promptTokens: number;
  completionTokens: number;
  limits: {
    requestsLimit?: number;
    requestsRemaining?: number;
    tokensLimit?: number;
    tokensRemaining?: number;
  };
  search: { used: number; limit: number } | null;
};

export type StreamEvent =
  | { type: "meta"; provider: ProviderId; model: string; mode: Mode; project: boolean }
  | { type: "notice"; message: string }
  | { type: "sources"; sources: Source[] }
  | { type: "summary"; summary: string; folded: number }
  | { type: "delta"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "progress"; files: number; chars: number }
  | { type: "project"; files: ProjectFile[] }
  | ({ type: "usage" } & UsageEvent)
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "general", label: "General", hint: "Everyday questions" },
  { id: "code", label: "Code", hint: "Programming help and full projects" },
  { id: "research", label: "Research", hint: "Deeper web search with citations" },
  { id: "writer", label: "Writer", hint: "Drafting and editing text" },
];

export async function fetchModels(signal?: AbortSignal): Promise<ModelsResponse> {
  const res = await fetch("/api/models", { signal });
  if (!res.ok) throw new Error(`Could not load models (HTTP ${res.status}).`);
  return res.json();
}

export type ChatRequest = {
  provider: ProviderId;
  model: string;
  mode: Mode;
  project: boolean;
  search: boolean;
  summary?: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

export class ChatHttpError extends Error {
  code?: string;
  retryAfter?: number;
  constructor(message: string, code?: string, retryAfter?: number) {
    super(message);
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** POSTs to /api/chat and calls onEvent for each server-sent event. */
export async function streamChat(
  req: ChatRequest,
  onEvent: (e: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ChatHttpError("Can't reach Mira's server. Check your connection and try again.", "network");
  }

  if (!res.ok) {
    let msg = `Request failed (HTTP ${res.status}).`;
    let code: string | undefined;
    let retryAfter: number | undefined;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
      code = j?.code;
      retryAfter = j?.retryAfter;
    } catch {
      /* non-JSON error page */
    }
    throw new ChatHttpError(msg, code, retryAfter);
  }
  if (!res.body) throw new ChatHttpError("The server returned no data.", "empty");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const ev = JSON.parse(payload) as StreamEvent;
          if (ev.type === "done") sawDone = true;
          onEvent(ev);
        } catch {
          /* ignore malformed line */
        }
      }
    }
  }
  if (!sawDone && !signal.aborted)
    throw new ChatHttpError("The connection closed before the reply finished.", "incomplete");
}

export function formatContext(n?: number) {
  if (!n) return "";
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  return `${Math.round(n / 1024)}K`;
}
