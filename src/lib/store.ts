// Local stores for chat history, downloads, and usage.
// Replace with backend calls when wiring NVIDIA / Lovable Cloud later.

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

const KEY_SESSIONS = "mira-sessions";
const KEY_DOWNLOADS = "mira-downloads";
const KEY_USAGE = "mira-usage";

export const getSessions = (): ChatSession[] => {
  const raw = localStorage.getItem(KEY_SESSIONS);
  return raw ? JSON.parse(raw) : [];
};
export const saveSessions = (s: ChatSession[]) => localStorage.setItem(KEY_SESSIONS, JSON.stringify(s));

export const upsertSession = (session: ChatSession) => {
  const all = getSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.unshift(session);
  saveSessions(all);
};
export const deleteSession = (id: string) => saveSessions(getSessions().filter((s) => s.id !== id));

export const getDownloads = (): DownloadItem[] => {
  const raw = localStorage.getItem(KEY_DOWNLOADS);
  return raw ? JSON.parse(raw) : [];
};
export const addDownload = (item: DownloadItem) => {
  const all = getDownloads();
  all.unshift(item);
  localStorage.setItem(KEY_DOWNLOADS, JSON.stringify(all));
};
export const deleteDownload = (id: string) => {
  const all = getDownloads().filter((d) => d.id !== id);
  localStorage.setItem(KEY_DOWNLOADS, JSON.stringify(all));
};

export const getUsage = (): UsageStats => {
  const raw = localStorage.getItem(KEY_USAGE);
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
  localStorage.setItem(KEY_USAGE, JSON.stringify(usage));
};

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
