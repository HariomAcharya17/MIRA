import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Download,
  Plus,
  Sparkles,
  User as UserIcon,
  Brain,
  Activity,
  ShieldCheck,
  Hash,
  BarChart3,
  Lock,
  Info,
  Globe,
  Zap,
} from "lucide-react";
import { MIRA_MODELS } from "@/lib/mira-api";
import {
  ChatMessage,
  ChatSession,
  getUsage,
  recordUsage,
  upsertSession,
  downloadAsFile,
} from "@/lib/store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const newSessionId = () =>
  `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const AI = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Removed capability selector state as requested
  const capability = "text";

  const filteredModels = useMemo(() => {
    return MIRA_MODELS.filter((m) => {
      if (capability === "text")
        return ["general", "reasoning", "vision", "multimodal"].includes(
          m.category
        );
      if (capability === "code") return m.category === "code";
      if (capability === "speech") return m.category === "multimodal";
      return true;
    });
  }, [capability]);

  // If no models match the filter (e.g. "code" or "speech" tab), fall back to all
  const displayModels =
    filteredModels.length > 0 ? filteredModels : MIRA_MODELS;

  const [modelId, setModelId] = useState(displayModels[0]?.id || MIRA_MODELS[0].id);

  useEffect(() => {
    if (displayModels.length > 0 && !displayModels.find((m) => m.id === modelId)) {
      setModelId(displayModels[0].id);
    }
  }, [displayModels, modelId]);

  const model = useMemo(
    () => MIRA_MODELS.find((m) => m.id === modelId) || MIRA_MODELS[0],
    [modelId]
  );

  const [session, setSession] = useState<ChatSession>(() => ({
    id: newSessionId(),
    title: "New Session",
    model: modelId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

  const [usage, setUsage] = useState(() =>
    user
      ? getUsage()
      : {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requests: 0,
        byModel: {},
        history: [],
      }
  );

  useEffect(() => {
    if (!user) {
      setUsage({
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requests: 0,
        byModel: {},
        history: [],
      });
      setSession({
        id: newSessionId(),
        title: "New Session",
        model: modelId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      abortRef.current?.abort();
      setBusy(false);
    } else {
      setUsage(getUsage());
    }
  }, [user]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem("mira-pending-prompt");
    if (pending) {
      setInput(pending);
      sessionStorage.removeItem("mira-pending-prompt");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session.messages, busy]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = async () => {
    if (!input.trim() || busy) return;

    const userPrompt = input.trim();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userPrompt,
      createdAt: Date.now(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    const updated: ChatSession = {
      ...session,
      title:
        session.messages.length === 0
          ? userPrompt.slice(0, 30)
          : session.title,
      messages: [...session.messages, userMsg, assistantMsg],
      model: modelId,
      updatedAt: Date.now(),
    };

    setSession(updated);
    setInput("");
    setBusy(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      let fullContent = "";

      const response = await fetch("/api/mira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          model: model.id,
          search: searchEnabled,
          messages: updated.messages
            .slice(0, -1)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (abort.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") break;
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            
            // 1. Handle actual content delta
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              fullContent += delta;
              setSession((prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ),
              }));
            }

            // 2. Handle final usage report from Groq
            if (parsed?.usage) {
              const { prompt_tokens, completion_tokens } = parsed.usage;
              recordUsage(model.id, prompt_tokens, completion_tokens);
              setUsage(getUsage());
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }

      if (!abort.signal.aborted) {
        const finalSession: ChatSession = {
          ...updated,
          messages: updated.messages.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          ),
          updatedAt: Date.now(),
        };
        upsertSession(finalSession);
      }
    } catch (e: any) {
      if (e?.name === "AbortError" || abort.signal.aborted) return;
      toast.error(e instanceof Error ? e.message : "Handshake failed");
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== assistantId),
      }));
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  };

  const newChat = () => {
    abortRef.current?.abort();
    setBusy(false);
    setSession({
      id: newSessionId(),
      title: "New Session",
      model: modelId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const exportChat = () => {
    if (session.messages.length === 0) return;
    const txt = session.messages
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`)
      .join("\n---\n\n");
    downloadAsFile(`mira-session-${session.id}.txt`, txt, "text/plain");
    toast.success("Session Exported");
  };

  const usedTokens = usage.totalTokens;
  const QUOTA = 1_000_000;
  const remainingTokens = Math.max(QUOTA - usedTokens, 0);
  const usedPct = Math.min((usedTokens / QUOTA) * 100, 100);

  return (
    <Layout hideFooter>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100dvh-64px)] py-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch gap-6 h-full min-h-0">
          {/* ── Chat Workspace ── */}
          <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0 relative">
            <div className="absolute -top-20 -left-20 -right-20 h-40 bg-mira-purple/5 blur-[100px] pointer-events-none" />
            <div className="flex items-center justify-between px-2 shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[120px] sm:max-w-[300px]">
                  {session.title}
                </h1>
                <div className="h-7 bg-muted/50 px-4 flex items-center rounded-full">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple font-bold">
                    Neural Workspace
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={newChat}
                  className="h-8 text-xs rounded-lg"
                >
                  <Plus className="size-4 mr-1.5" /> New Session
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportChat}
                  className="h-8 text-xs rounded-lg"
                >
                  <Download className="size-4 mr-1.5" /> Export
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden flex flex-col flex-1 relative shadow-sm min-h-0">
              <TrafficLights label={`${model.name} // MIRA Interface`} />

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 custom-scrollbar"
              >
                {session.messages.length === 0 ? (
                  <EmptyState onPick={(p) => setInput(p)} />
                ) : (
                  session.messages
                    .filter(
                      (m) => m.content !== "" || m.role === "user"
                    )
                    .map((m) => <Message key={m.id} m={m} />)
                )}
                {busy && (
                  <div className="flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col items-center gap-2 px-2">
                      <div className="relative size-6">
                        <div className="absolute inset-0 rounded-full border-[3px] border-t-mira-purple border-r-mira-cyan border-b-mira-pink border-l-mira-blue animate-spin" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-foreground/40 uppercase tracking-[0.4em]">
                        MIRA Thinking
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8 border-t border-border bg-muted/10 shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm focus-within:border-mira-purple/50 transition-all duration-200">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        (e.preventDefault(), send())
                      }
                      placeholder="Ask MIRA anything..."
                      className="w-full bg-transparent px-6 py-4 text-base text-foreground outline-none min-h-[50px] max-h-[120px] resize-none placeholder:text-muted-foreground/60 font-light"
                      rows={1}
                    />
                      <div className="flex items-center gap-2 px-4 pb-3">
                        <Select value={modelId} onValueChange={setModelId}>
                          <SelectTrigger className="w-auto h-7 bg-muted border-none text-[10px] font-mono uppercase tracking-widest px-4 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {displayModels.map((m) => (
                              <SelectItem
                                key={m.id}
                                value={m.id}
                                className="text-xs uppercase font-mono tracking-tighter"
                              >
                                {m.name}
                                {m.badge ? ` · ${m.badge}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchEnabled(!searchEnabled)}
                          className={cn(
                            "h-7 px-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all",
                            searchEnabled 
                              ? "bg-mira-purple/10 text-mira-purple hover:bg-mira-purple/20" 
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Globe className={cn("size-3 mr-1.5", searchEnabled && "animate-pulse")} />
                          Search {searchEnabled ? "On" : "Off"}
                        </Button>

                        <div className="flex-1" />

                        <Button
                          onClick={send}
                          disabled={busy || !input.trim()}
                          size="icon"
                          className="btn-mira size-9 rounded-xl"
                        >
                          <Send className="size-4" />
                        </Button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLORFUL TELEMETRY SIDEBAR */}
          <div className="w-full lg:w-[320px] shrink-0 min-h-0 flex flex-col">
            <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-8 flex-1 border-border/40 dark:border-white/5 bg-card/10 dark:bg-white/[0.01]">
              <div className="flex items-center gap-3 px-2">
                <div className="size-2 bg-mira-purple rounded-full animate-ping" />
                <span className="text-[11px] font-mono uppercase tracking-[0.4em] text-foreground dark:text-muted-foreground/60 font-bold">
                  Telemetry Core
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* USED TOKENS - VIBRANT CYAN/BLUE */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-mira-cyan/20 to-mira-blue/20 border border-mira-cyan/20 rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] shadow-sm">
                  <div className="absolute -right-4 -top-4 size-24 bg-mira-cyan/10 blur-2xl rounded-full" />
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="size-3.5 text-mira-cyan" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-mira-cyan font-bold">
                      Neural Used
                    </span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums tracking-tighter text-foreground dark:text-white drop-shadow-sm">
                    {usedTokens.toLocaleString()}
                    <span className="text-[10px] font-mono text-muted-foreground dark:text-white/30 ml-1.5 uppercase">
                      tokens
                    </span>
                  </div>
                </div>

                {/* REMAINING - VIBRANT PINK/PURPLE */}
                <div className="relative group overflow-hidden bg-gradient-to-br from-mira-pink/20 to-mira-purple/20 border border-mira-pink/20 rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] shadow-sm">
                  <div className="absolute -right-4 -top-4 size-24 bg-mira-pink/10 blur-2xl rounded-full" />
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="size-3.5 text-mira-pink" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-mira-pink font-bold">
                      Available
                    </span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums tracking-tighter text-foreground dark:text-white drop-shadow-sm">
                    {remainingTokens.toLocaleString()}
                    <span className="text-[10px] font-mono text-muted-foreground dark:text-white/30 ml-1.5 uppercase">
                      tokens
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 font-bold">
                    System Load
                  </span>
                  <span className="text-[9px] font-mono text-mira-purple font-bold">
                    {usedPct.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-mira-blue via-mira-purple to-mira-pink rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-muted-foreground/30 font-bold uppercase tracking-widest">
                  <span>Zero</span>
                  <span>{QUOTA.toLocaleString()} Max</span>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-3 px-2">
                <MetaLine icon={ShieldCheck} label="Identity" value="Secured" color="text-emerald-500" />
                <MetaLine icon={Hash} label="Protocol" value="Quantum" color="text-mira-cyan" />
                <MetaLine icon={Lock} label="Storage" value="AES-256" color="text-mira-pink" />
              </div>

              <div className="mt-auto p-5 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-mira-purple uppercase tracking-[0.2em] font-black">
                  <ShieldCheck className="size-3 text-emerald-500 shadow-emerald-500/50" /> 
                  Privacy Shield
                </div>
                <p className="text-[9px] text-muted-foreground/50 leading-relaxed font-medium">
                  Your neural sessions are localized and encrypted. MIRA ensures zero remote data retention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ── Glow letter effect ────────────────────────────────────────────────────────
const GlowLetter = ({ letter }: { letter: string }) => (
  <span
    className="inline-block cursor-default"
    style={{ transition: "color 0.3s ease, text-shadow 0.3s ease, transform 0.3s ease" }}
    onMouseEnter={(e) => {
      const el = e.currentTarget;
      el.style.color = "hsl(260, 80%, 75%)";
      el.style.textShadow = `
        0 0 8px hsl(260 80% 70% / 0.9),
        0 0 20px hsl(260 70% 65% / 0.7),
        0 0 40px hsl(255 70% 60% / 0.5),
        0 0 80px hsl(255 60% 55% / 0.3)
      `;
      el.style.transform = "translateY(-2px) scale(1.12)";
      const parent = el.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.children) as HTMLElement[];
      const idx = siblings.indexOf(el);
      const applyNeighbor = (offset: number, intensity: number) => {
        const neighbor = siblings[idx + offset];
        if (!neighbor) return;
        neighbor.style.color = `hsl(260, 70%, ${60 + intensity * 10}%)`;
        neighbor.style.textShadow = `0 0 ${6 * intensity}px hsl(260 70% 65% / ${0.5 * intensity}), 0 0 ${16 * intensity}px hsl(255 60% 60% / ${0.3 * intensity})`;
        neighbor.style.transform = `translateY(${-1 * intensity}px) scale(${1 + 0.03 * intensity})`;
      };
      applyNeighbor(-2, 0.3);
      applyNeighbor(-1, 0.6);
      applyNeighbor(1, 0.6);
      applyNeighbor(2, 0.3);
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget;
      el.style.color = "";
      el.style.textShadow = "";
      el.style.transform = "";
      const parent = el.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.children) as HTMLElement[];
      const idx = siblings.indexOf(el);
      [-2, -1, 1, 2].forEach((offset) => {
        const neighbor = siblings[idx + offset];
        if (!neighbor) return;
        neighbor.style.color = "";
        neighbor.style.textShadow = "";
        neighbor.style.transform = "";
      });
    }}
  >
    {letter}
  </span>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onPick }: { onPick: (p: string) => void }) => {
  const samples = [
    {
      title: "Code",
      desc: "Review and refactor my React component for performance.",
      sub: "Engineering",
    },
    {
      title: "Research",
      desc: "Summarize the latest breakthroughs in multimodal AI.",
      sub: "Analysis",
    },
    {
      title: "Reason",
      desc: "Compare Gemini Flash vs Pro for long-context tasks.",
      sub: "Evaluation",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center py-10 px-4">
      <div className="size-16 rounded-2xl bg-mira-purple/5 border border-mira-purple/10 flex items-center justify-center mb-8">
        <Brain className="size-8 text-mira-purple" />
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
        {"MIRA".split("").map((l, i) => (
          <GlowLetter key={i} letter={l} />
        ))}
      </h2>

      <p className="text-muted-foreground/60 max-w-sm mb-2 text-sm font-light">
        Our personalized superfast AI to help you.
      </p>
      <p className="text-muted-foreground/40 max-w-sm mb-12 text-xs font-mono uppercase tracking-widest">
        Switch models · preserve context · think deeper
      </p>

      <div className="grid sm:grid-cols-3 gap-4 w-full max-w-4xl">
        {samples.map((s) => (
          <button
            key={s.title}
            onClick={() => onPick(s.desc)}
            className="text-left p-6 rounded-2xl bg-card border border-border hover:border-mira-purple/30 hover:bg-muted/30 transition-all group shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-mira-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple mb-3 font-bold">
                {s.title}
              </div>
              <div className="text-sm font-semibold text-foreground mb-2 group-hover:text-mira-purple transition-colors leading-snug">
                {s.desc}
              </div>
              <div className="text-[10px] text-muted-foreground/60 font-medium">
                {s.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────
const Message = ({ m }: { m: ChatMessage }) => (
  <div
    className={cn(
      "flex gap-6 min-w-0 max-w-full",
      m.role === "user" ? "flex-row-reverse" : "flex-row"
    )}
  >
    <div
      className={cn(
        "size-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm",
        m.role === "user"
          ? "bg-muted border border-border"
          : "bg-mira-purple text-white"
      )}
    >
      {m.role === "user" ? (
        <UserIcon className="size-4" />
      ) : (
        <Sparkles className="size-4" />
      )}
    </div>
    <div
      className={cn(
        "flex-1 min-w-0 max-w-full space-y-2",
        m.role === "user" ? "text-right" : "text-left"
      )}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 font-bold">
        {m.role === "user" ? "You" : "MIRA"} //{" "}
        {new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div
        className={cn(
          "inline-block rounded-2xl px-6 py-4 max-w-full sm:max-w-[90%] text-left relative overflow-x-auto",
          m.role === "user"
            ? "bg-muted/50 border border-border text-foreground"
            : "bg-transparent border-none p-0"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-full prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:text-mira-purple font-normal text-foreground overflow-wrap-anywhere dark:text-foreground/90">
          <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  </div>
);

// ── Sidebar meta line ─────────────────────────────────────────────────────────
const MetaLine = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) => (
  <div className="flex justify-between items-center text-[10px] font-mono group">
    <div className="flex items-center gap-2">
      <Icon className={cn("size-3 text-muted-foreground/40 transition-colors", color)} />
      <span className="text-muted-foreground/50 uppercase tracking-widest group-hover:text-muted-foreground/70 transition-colors font-bold">
        {label}
      </span>
    </div>
    <span className="text-foreground/80 font-bold tracking-tight">
      {value}
    </span>
  </div>
);

export default AI;