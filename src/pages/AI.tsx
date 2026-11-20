import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Code2, Globe, Menu, PenLine, SquarePen, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ModelPicker, type ModelRef } from "@/components/chat/ModelPicker";
import { Composer } from "@/components/chat/Composer";
import { MessageView } from "@/components/chat/MessageView";
import { ProjectPanel } from "@/components/chat/ProjectPanel";
import {
  ChatHttpError,
  fetchModels,
  streamChat,
  type Mode,
  type ModelsResponse,
  type StreamEvent,
  type UsageEvent,
} from "@/lib/mira-api";
import {
  ChatMessage,
  ChatSession,
  deleteSession,
  getSession,
  getSessions,
  recordUsage,
  saveSessions,
  upsertSession,
} from "@/lib/store";
import { deleteRemoteSession, pullSessions, pushSession } from "@/lib/chat-sync";

const newId = () => `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const blankSession = (model?: ModelRef | null, mode: Mode = "general"): ChatSession => ({
  id: newId(),
  title: "New chat",
  model: model?.id ?? "",
  provider: model?.provider,
  mode,
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  },
};

const SUGGESTIONS = [
  { mode: "general" as Mode, icon: Globe, label: "Latest news", text: "What are today's top technology headlines?" },
  { mode: "code" as Mode, icon: Code2, label: "Code", text: "Explain the difference between useMemo and useCallback with examples." },
  { mode: "research" as Mode, icon: BookOpen, label: "Research", text: "Compare the current free tiers of the major LLM API providers." },
  { mode: "writer" as Mode, icon: PenLine, label: "Writing", text: "Rewrite this paragraph to be clearer and more concise:" },
];

function pickDefault(data: ModelsResponse | undefined, wanted: ModelRef | null): ModelRef | null {
  if (!data?.models.length) return wanted;
  if (wanted && data.models.some((m) => m.provider === wanted.provider && m.id === wanted.id)) return wanted;
  const first = data.models.find((m) => !m.isCode) ?? data.models[0];
  return { provider: first.provider, id: first.id };
}

export default function AI() {
  const { user, isMock, logout } = useAuth();
  const greetingName = user?.name?.split(" ")[0] ?? "";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const remote = Boolean(user && !isMock);

  const models = useQuery({ queryKey: ["models"], queryFn: ({ signal }) => fetchModels(signal), staleTime: 10 * 60_000, retry: 1 });
  const [modelRef, setModelRef] = useState<ModelRef | null>(() => store.get<ModelRef | null>("mira:model", null));
  const effectiveModel = useMemo(() => pickDefault(models.data, modelRef), [models.data, modelRef]);

  const [mode, setMode] = useState<Mode>(() => store.get<Mode>("mira:mode", "general"));
  const [project, setProject] = useState(false);
  const [search, setSearch] = useState(() => store.get("mira:search", true));
  const [sessions, setSessions] = useState<ChatSession[]>(() => getSessions());
  const [session, setSession] = useState<ChatSession>(() => {
    const id = params.get("s");
    return (id && getSession(id)) || blankSession(null);
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ files: number; chars: number } | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  // Id of the chat on screen; set synchronously so a finishing stream never
  // overwrites a chat the user has switched to.
  const activeIdRef = useRef(session.id);

  useEffect(() => store.set("mira:mode", mode), [mode]);
  useEffect(() => store.set("mira:search", search), [search]);
  useEffect(() => {
    if (mode !== "code") setProject(false);
  }, [mode]);

  // Prompt handed over from the landing page.
  useEffect(() => {
    const pending = sessionStorage.getItem("mira-pending-prompt");
    if (pending) {
      setInput(pending);
      sessionStorage.removeItem("mira-pending-prompt");
    }
  }, []);

  // Pull cloud history once for real Supabase users.
  useEffect(() => {
    if (!remote) return;
    let cancelled = false;
    pullSessions().then((remoteSessions) => {
      if (cancelled || !remoteSessions?.length) return;
      const local = getSessions();
      const merged = new Map(local.map((s) => [s.id, s]));
      for (const r of remoteSessions) {
        const l = merged.get(r.id);
        if (!l || r.updatedAt > l.updatedAt) merged.set(r.id, r);
      }
      saveSessions([...merged.values()]);
      setSessions(getSessions());
    });
    return () => {
      cancelled = true;
    };
  }, [remote]);

  // Stop any stream when leaving the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep scrolled to the bottom while streaming, unless the user scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [session.messages]);

  const persist = useCallback(
    (s: ChatSession) => {
      if (!s.messages.length) return;
      upsertSession(s);
      setSessions(getSessions());
      if (remote) pushSession(s).catch(() => {});
    },
    [remote],
  );

  const chooseModel = (r: ModelRef) => {
    setModelRef(r);
    store.set("mira:model", r);
  };

  const openSession = (id: string) => {
    if (busy) abortRef.current?.abort();
    const s = getSession(id);
    if (!s) return;
    activeIdRef.current = s.id;
    setSession(s);
    if (s.mode) setMode(s.mode);
    setOpenProjectId(null);
    setSidebarOpen(false);
    setParams({ s: id }, { replace: true });
    stickRef.current = true;
  };

  const newChat = () => {
    if (busy) abortRef.current?.abort();
    const fresh = blankSession(effectiveModel, mode);
    activeIdRef.current = fresh.id;
    setSession(fresh);
    setOpenProjectId(null);
    setSidebarOpen(false);
    setInput("");
    setParams({}, { replace: true });
  };

  const removeSession = (id: string) => {
    if (!confirm("Delete this chat? This can't be undone.")) return;
    deleteSession(id);
    if (remote) deleteRemoteSession(id).catch(() => {});
    setSessions(getSessions());
    if (session.id === id) newChat();
  };

  const checkQuota = (u: UsageEvent, model: string) => {
    const warnings: string[] = [];
    const { requestsLimit, requestsRemaining } = u.limits;
    if (requestsLimit && requestsRemaining != null && requestsRemaining / requestsLimit < 0.1)
      warnings.push(`${model}: ${requestsRemaining} of ${requestsLimit} daily requests left. Switch models to keep going.`);
    if (u.search && u.search.used / u.search.limit >= 0.9)
      warnings.push(`Web search: ${u.search.used} of ${u.search.limit} monthly credits used.`);
    setWarning(warnings.length ? warnings.join(" ") : null);
  };

  const run = async (base: ChatSession, userText: string | null) => {
    const target = effectiveModel;
    if (!target) {
      toast.error(models.error ? "Couldn't load the model list. Refresh to try again." : "Choose a model first.");
      return;
    }
    const now = Date.now();
    const messages = [...base.messages];
    if (userText !== null) messages.push({ id: crypto.randomUUID(), role: "user", content: userText, createdAt: now });
    const assistant: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: now,
      model: target.id,
      provider: target.provider,
    };
    const firstUser = messages.find((m) => m.role === "user")?.content ?? "New chat";
    let current: ChatSession = {
      ...base,
      title: base.messages.length ? base.title : firstUser.replace(/\s+/g, " ").slice(0, 60),
      model: target.id,
      provider: target.provider,
      mode,
      messages: [...messages, assistant],
      updatedAt: now,
    };
    activeIdRef.current = current.id;
    setSession(current);
    setBusy(true);
    setStreamingId(assistant.id);
    setProgress(null);
    stickRef.current = true;

    const summarized = base.summarizedCount ?? 0;
    const history = messages
      .slice(summarized)
      .filter((m) => !m.error && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let pending: Partial<ChatMessage> = {};
    let frame = 0;
    const msg: ChatMessage = { ...assistant };
    const flush = () => {
      frame = 0;
      Object.assign(msg, pending);
      pending = {};
      current = {
        ...current,
        messages: current.messages.map((m) => (m.id === msg.id ? { ...msg } : m)),
      };
      if (activeIdRef.current === current.id) setSession(current);
    };
    const update = (patch: Partial<ChatMessage>, immediate = false) => {
      pending = { ...pending, ...patch };
      if (immediate) {
        if (frame) cancelAnimationFrame(frame);
        flush();
      } else if (!frame) frame = requestAnimationFrame(flush);
    };
    let text = "";
    let reasoning = "";

    const onEvent = (e: StreamEvent) => {
      switch (e.type) {
        case "meta":
          update({ model: e.model, provider: e.provider }, true);
          break;
        case "notice":
          update({ notices: [...(msg.notices ?? []), ...(pending.notices ?? []), e.message].filter((v, i, a) => a.indexOf(v) === i) }, true);
          break;
        case "sources":
          update({ sources: e.sources }, true);
          break;
        case "summary":
          current = { ...current, summary: e.summary, summarizedCount: summarized + e.folded };
          break;
        case "delta":
          text += e.text;
          update({ content: text });
          break;
        case "reasoning":
          reasoning += e.text;
          update({ reasoning });
          break;
        case "progress":
          setProgress({ files: e.files, chars: e.chars });
          break;
        case "project":
          update({ project: e.files }, true);
          setOpenProjectId(msg.id);
          break;
        case "usage":
          recordUsage(msg.model ?? target.id, e.promptTokens, e.completionTokens);
          checkQuota(e, msg.model ?? target.id);
          break;
        case "error":
          update({ error: e.message }, true);
          break;
      }
    };

    try {
      await streamChat(
        {
          provider: target.provider,
          model: target.id,
          mode,
          project: mode === "code" && project,
          search: search || mode === "research",
          summary: base.summary,
          messages: history,
        },
        onEvent,
        ctrl.signal,
      );
    } catch (err) {
      if (!ctrl.signal.aborted) {
        const m = err instanceof ChatHttpError || err instanceof Error ? err.message : "Something went wrong.";
        update({ error: m }, true);
      }
    } finally {
      if (frame) cancelAnimationFrame(frame);
      flush();
      if (ctrl.signal.aborted && !msg.content && !msg.project) {
        current = { ...current, messages: current.messages.filter((m) => m.id !== msg.id) };
      }
      current = { ...current, updatedAt: Date.now() };
      if (activeIdRef.current === current.id) setSession(current);
      persist(current);
      setBusy(false);
      setStreamingId(null);
      setProgress(null);
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (!session.messages.length) setParams({ s: session.id }, { replace: true });
    run(session, text);
  };

  const regenerate = () => {
    if (busy) return;
    const msgs = session.messages;
    const lastAssistant = msgs.length && msgs[msgs.length - 1].role === "assistant" ? msgs.length - 1 : msgs.length;
    run({ ...session, messages: msgs.slice(0, lastAssistant) }, null);
  };

  const stop = () => abortRef.current?.abort();

  const openProject = session.messages.find((m) => m.id === openProjectId)?.project;
  const lastId = session.messages[session.messages.length - 1]?.id;

  const sidebar = (
    <ChatSidebar
      sessions={sessions}
      activeId={session.id}
      onSelect={openSession}
      onNew={newChat}
      onDelete={removeSession}
      userName={user?.name}
      onLogout={async () => {
        abortRef.current?.abort();
        await logout();
        navigate("/");
      }}
    />
  );

  return (
    <div className="mira-app flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden md:block w-64 shrink-0 border-r border-border">{sidebar}</aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="mira-app w-72 p-0 border-r border-border bg-sidebar [&>button]:hidden">
          <SheetTitle className="sr-only">Chats</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-1 px-2 sm:px-4 shrink-0">
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chats"
          >
            <Menu className="size-5" />
          </button>
          <ModelPicker
            data={models.data ?? null}
            loading={models.isLoading}
            error={models.error ? String((models.error as Error).message) : null}
            value={effectiveModel}
            onChange={chooseModel}
          />
          <div className="flex-1" />
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent"
            onClick={newChat}
            aria-label="New chat"
          >
            <SquarePen className="size-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            {session.messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
                <Logo className="size-10 rounded-xl text-base" />
                <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
                  {greetingName ? `What can I help with, ${greetingName}?` : "What can I help with?"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Answers include live web results. Switch models or modes at any time.
                </p>
                <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => {
                        setMode(s.mode);
                        setInput(s.text);
                      }}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm hover:border-foreground/20 hover:bg-accent/50 transition-colors"
                    >
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                        <s.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-medium text-muted-foreground">{s.label}</span>
                        <span className="mt-0.5 block text-foreground/90">{s.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-6">
                {session.messages.map((m) => (
                  <MessageView
                    key={m.id}
                    m={m}
                    streaming={m.id === streamingId}
                    progress={m.id === streamingId ? progress : null}
                    isLast={m.id === lastId && m.role === "assistant"}
                    onRegenerate={regenerate}
                    onOpenProject={() => setOpenProjectId(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-3 pb-3 sm:px-6 sm:pb-5">
          <div className="mx-auto w-full max-w-3xl">
            {warning && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span className="flex-1">{warning}</span>
                <button type="button" onClick={() => setWarning(null)} aria-label="Dismiss">
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            <Composer
              value={input}
              onChange={setInput}
              onSend={send}
              onStop={stop}
              busy={busy}
              disabled={!effectiveModel}
              mode={mode}
              onMode={setMode}
              project={project}
              onProject={setProject}
              search={search}
              onSearch={setSearch}
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Mira can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </main>

      {openProject && (
        <section
          className="fixed inset-0 z-40 lg:static lg:z-auto lg:w-[46%] lg:max-w-[760px] lg:shrink-0 lg:border-l lg:border-border"
          aria-label="Generated project"
        >
          <ProjectPanel key={openProjectId} files={openProject} onClose={() => setOpenProjectId(null)} />
        </section>
      )}
    </div>
  );
}
