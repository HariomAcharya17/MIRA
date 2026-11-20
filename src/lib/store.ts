import type { Mode, ProjectFile, ProviderId, Source } from "@/lib/mira-api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  model?: string;
  provider?: ProviderId;
  sources?: Source[];
  notices?: string[];
  reasoning?: string;
  project?: ProjectFile[];
  error?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  model: string;
  provider?: ProviderId;
  mode?: Mode;
  /** Running summary of messages[0..summarizedCount) built by the server. */
  summary?: string;
  summarizedCount?: number;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type DownloadItem = {
  id: string;
  name: string;
  type: "code" | "image" | "text";
  content: string;
  size: number;
  createdAt: number;
};

export type UsageStats = {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requests: number;
  byModel: Record<string, { tokens: number; requests: number }>;
  history: { date: string; tokens: number }[];
};

// ── USER-SCOPED KEY HELPERS ──────────────────────────────────────────────────
const getUserId = (): string | null => {
  // 1. Try Supabase session first
  const raw = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  if (raw) {
    try {
      const parsed = JSON.parse(localStorage.getItem(raw) || "");
      if (parsed?.user?.id) return parsed.user.id;
    } catch {
      /* ignore */
    }
  }
  // 2. Try Mock session
  const mock = localStorage.getItem("mira-mock-user");
  if (mock) {
    try {
      const parsed = JSON.parse(mock);
      if (parsed?.id) return parsed.id;
    } catch {
      /* ignore */
    }
  }
  return null;
};

const key = (base: string): string => {
  const uid = getUserId();
  return uid ? `${base}:${uid}` : base;
};

const KEY_SESSIONS = "mira-sessions";
const KEY_DOWNLOADS = "mira-downloads";
const KEY_USAGE = "mira-usage";

// ── SESSIONS ─────────────────────────────────────────────────────────────────
const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getSessions = (): ChatSession[] =>
  safeParse<ChatSession[]>(localStorage.getItem(key(KEY_SESSIONS)), []).sort((a, b) => b.updatedAt - a.updatedAt);

export const saveSessions = (s: ChatSession[]) => {
  try {
    localStorage.setItem(key(KEY_SESSIONS), JSON.stringify(s));
  } catch {
    // Storage full: drop the oldest sessions and retry once.
    const trimmed = [...s].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, Math.max(5, Math.floor(s.length / 2)));
    try {
      localStorage.setItem(key(KEY_SESSIONS), JSON.stringify(trimmed));
    } catch {
      /* give up silently; chat still works in memory */
    }
  }
};

export const getSession = (id: string) => getSessions().find((s) => s.id === id);

export const clearSessions = () => localStorage.removeItem(key(KEY_SESSIONS));

export const upsertSession = (session: ChatSession) => {
  const all = getSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.unshift(session);
  saveSessions(all);
};

export const deleteSession = (id: string) =>
  saveSessions(getSessions().filter((s) => s.id !== id));

// ── DOWNLOADS ────────────────────────────────────────────────────────────────
export const getDownloads = (): DownloadItem[] => safeParse<DownloadItem[]>(localStorage.getItem(key(KEY_DOWNLOADS)), []);

export const addDownload = (item: DownloadItem) => {
  const all = getDownloads();
  all.unshift(item);
  localStorage.setItem(key(KEY_DOWNLOADS), JSON.stringify(all));
};

export const deleteDownload = (id: string) => {
  const all = getDownloads().filter((d) => d.id !== id);
  localStorage.setItem(key(KEY_DOWNLOADS), JSON.stringify(all));
};

// ── USAGE ────────────────────────────────────────────────────────────────────
export const getUsage = (): UsageStats => {
  const raw = safeParse<UsageStats | null>(localStorage.getItem(key(KEY_USAGE)), null);
  if (raw) return raw;
  return { totalTokens: 0, promptTokens: 0, completionTokens: 0, requests: 0, byModel: {}, history: [] };
};

export const recordUsage = (model: string, promptTokens: number, completionTokens: number) => {
  const usage = getUsage();
  const total = promptTokens + completionTokens;
  usage.totalTokens += total;
  usage.promptTokens += promptTokens;
  usage.completionTokens += completionTokens;
  usage.requests += 1;
  if (!usage.byModel[model]) usage.byModel[model] = { tokens: 0, requests: 0 };
  usage.byModel[model].tokens += total;
  usage.byModel[model].requests += 1;
  const today = new Date().toISOString().slice(0, 10);
  const last = usage.history[usage.history.length - 1];
  if (last && last.date === today) last.tokens += total;
  else usage.history.push({ date: today, tokens: total });
  if (usage.history.length > 14) usage.history = usage.history.slice(-14);
  localStorage.setItem(key(KEY_USAGE), JSON.stringify(usage));
};

// ── FILE DOWNLOAD ─────────────────────────────────────────────────────────────
export const downloadAsFile = (filename: string, content: string, mime = "text/plain") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};