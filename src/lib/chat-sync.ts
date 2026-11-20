// Optional cloud sync of chats and generated projects to Supabase.
// Active only for real Supabase sessions (not mock auth). localStorage stays
// the primary cache, so the app keeps working if Supabase is down or the
// tables have not been created yet (see supabase/migrations).
import { supabase } from "@/lib/supabase";
import type { ChatMessage, ChatSession } from "@/lib/store";
import type { ProjectFile, ProviderId, Mode, Source } from "@/lib/mira-api";
import { projectName } from "@/lib/project";

let disabled = false; // set after a "table missing" error to avoid noisy retries

function handle(error: { code?: string; message?: string } | null, what: string) {
  if (!error) return true;
  // 42P01 = undefined_table, PGRST205 = table not in schema cache
  if (error.code === "42P01" || error.code === "PGRST205") {
    disabled = true;
    console.info("[mira] Supabase chat tables not found; cloud sync off. Run supabase/migrations.");
  } else {
    console.warn(`[mira] sync ${what} failed:`, error.message);
  }
  return false;
}

type ChatRow = {
  id: string;
  title: string;
  model: string | null;
  provider: string | null;
  mode: string | null;
  summary: string | null;
  summarized_count: number;
  created_at: string;
  updated_at: string;
};
type MessageRow = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  model: string | null;
  provider: string | null;
  sources: Source[] | null;
  position: number;
  created_at: string;
};
type FileRow = { project_id: string; path: string; content: string };

export async function pullSessions(): Promise<ChatSession[] | null> {
  if (disabled) return null;
  const { data: chats, error } = await supabase
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (!handle(error, "chats") || !chats) return null;
  if (!chats.length) return [];
  const ids = (chats as ChatRow[]).map((c) => c.id);
  const [{ data: msgs, error: mErr }, { data: projects }] = await Promise.all([
    supabase.from("messages").select("*").in("chat_id", ids).order("position"),
    supabase.from("projects").select("id").in("chat_id", ids),
  ]);
  if (!handle(mErr, "messages")) return null;
  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
  let files: FileRow[] = [];
  if (projectIds.length) {
    const { data, error: fErr } = await supabase
      .from("project_files")
      .select("project_id,path,content")
      .in("project_id", projectIds);
    if (handle(fErr, "project_files")) files = (data as FileRow[]) ?? [];
  }

  const filesByProject = new Map<string, ProjectFile[]>();
  for (const f of files) {
    const list = filesByProject.get(f.project_id) ?? [];
    list.push({ path: f.path, content: f.content });
    filesByProject.set(f.project_id, list);
  }
  const msgsByChat = new Map<string, ChatMessage[]>();
  for (const m of (msgs as MessageRow[] | null) ?? []) {
    const list = msgsByChat.get(m.chat_id) ?? [];
    list.push({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: Date.parse(m.created_at),
      model: m.model ?? undefined,
      provider: (m.provider as ProviderId) ?? undefined,
      sources: m.sources ?? undefined,
      project: filesByProject.get(m.id),
    });
    msgsByChat.set(m.chat_id, list);
  }
  return (chats as ChatRow[]).map((c) => ({
    id: c.id,
    title: c.title,
    model: c.model ?? "",
    provider: (c.provider as ProviderId) ?? undefined,
    mode: (c.mode as Mode) ?? undefined,
    summary: c.summary ?? undefined,
    summarizedCount: c.summarized_count,
    messages: msgsByChat.get(c.id) ?? [],
    createdAt: Date.parse(c.created_at),
    updatedAt: Date.parse(c.updated_at),
  }));
}

export async function pushSession(s: ChatSession): Promise<void> {
  if (disabled) return;
  const { error } = await supabase.from("chats").upsert({
    id: s.id,
    title: s.title,
    model: s.model,
    provider: s.provider,
    mode: s.mode,
    summary: s.summary ?? null,
    summarized_count: s.summarizedCount ?? 0,
    created_at: new Date(s.createdAt).toISOString(),
    updated_at: new Date(s.updatedAt).toISOString(),
  });
  if (!handle(error, "chat")) return;

  const rows = s.messages
    .filter((m) => m.content || m.project)
    .map((m, i) => ({
      id: m.id,
      chat_id: s.id,
      role: m.role,
      content: m.content,
      model: m.model ?? null,
      provider: m.provider ?? null,
      sources: m.sources ?? null,
      position: i,
      created_at: new Date(m.createdAt).toISOString(),
    }));
  if (rows.length) {
    const { error: mErr } = await supabase.from("messages").upsert(rows);
    if (!handle(mErr, "messages")) return;
  }
  // Remove rows for messages deleted locally (e.g. regenerate).
  const keep = rows.map((r) => r.id);
  if (keep.length)
    await supabase.from("messages").delete().eq("chat_id", s.id).not("id", "in", `(${keep.map((k) => `"${k}"`).join(",")})`);

  for (const m of s.messages) if (m.project?.length) await pushProject(s.id, m.id, m.project);
}

async function pushProject(chatId: string, messageId: string, files: ProjectFile[]) {
  const { error } = await supabase
    .from("projects")
    .upsert({ id: messageId, chat_id: chatId, name: projectName(files) });
  if (!handle(error, "project")) return;
  const { error: fErr } = await supabase
    .from("project_files")
    .upsert(files.map((f) => ({ project_id: messageId, path: f.path, content: f.content })));
  handle(fErr, "project_files");
}

export async function deleteRemoteSession(id: string) {
  if (disabled) return;
  const { error } = await supabase.from("chats").delete().eq("id", id);
  handle(error, "delete");
}

export async function deleteAllRemoteSessions() {
  if (disabled) return;
  const { error } = await supabase.from("chats").delete().neq("id", "");
  handle(error, "delete all");
}
