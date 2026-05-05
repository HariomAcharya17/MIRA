import { supabase } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type ChatSession = {
  id: string;
  title: string;
  model: string;
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
  // Read synchronously from the cached session — no async needed
  const raw = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(raw) || "");
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
};

const key = (base: string): string => {
  const uid = getUserId();
  return uid ? `${base}:${uid}` : base;
};

const KEY_SESSIONS = "mira-sessions";
const KEY_DOWNLOADS = "mira-downloads";
const KEY_USAGE = "mira-usage";

// ── SESSIONS ─────────────────────────────────────────────────────────────────
export const getSessions = (): ChatSession[] => {
  const raw = localStorage.getItem(key(KEY_SESSIONS));
  return raw ? JSON.parse(raw) : [];
};

export const saveSessions = (s: ChatSession[]) =>
  localStorage.setItem(key(KEY_SESSIONS), JSON.stringify(s));

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
export const getDownloads = (): DownloadItem[] => {
  const raw = localStorage.getItem(key(KEY_DOWNLOADS));
  return raw ? JSON.parse(raw) : [];
};

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
  const raw = localStorage.getItem(key(KEY_USAGE));
  if (raw) return JSON.parse(raw);
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