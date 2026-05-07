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

  const [capability, setCapability] = useState<"text" | "code" | "speech">(
    "text"
  );

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
  }, [capability, displayModels, modelId]);

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
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              fullContent += delta;

              setSession((prev) => ({
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ),
              }));

              recordUsage(model.id, 0, Math.ceil(delta.length / 3.8));
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
        recordUsage(
          model.id,
          Math.ceil(userPrompt.length / 4),
          Math.ceil(fullContent.length / 4)
        );
        setUsage(getUsage());
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

  const QUOTA = 1_000_000;
  const usedTokens = usage.totalTokens;
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
                <Select
                  value={capability}
                  onValueChange={(v: any) => setCapability(v)}
                >
                  <SelectTrigger className="w-auto h-7 bg-muted border-none text-[10px] font-mono uppercase tracking-widest px-3 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Logic Core</SelectItem>
                    <SelectItem value="code">Code Engine</SelectItem>
                    <SelectItem value="speech">Audio</SelectItem>
                  </SelectContent>
                </Select>
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
                    <div className="flex items-center justify-between px-4 pb-3">
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

          {/* ── RIGHT SIDEBAR ── */}
          <div className="w-full lg:w-60 flex-col shrink-0 h-full min-h-0 hidden lg:flex">
            <div className="bg-card border border-border rounded-[2.5rem] p-6 flex flex-col gap-5 shadow-sm flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 font-bold">
                  <Activity className="size-3 text-mira-purple" /> Telemetry
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-mono uppercase tracking-widest border",
                    busy
                      ? "bg-mira-purple/10 text-mira-purple border-mira-purple/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  )}
                >
                  {busy ? "Active" : "Idle"}
                </span>
              </div>

              {usedTokens === 0 && !busy ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-2xl gap-2 opacity-40">
                  <Info className="size-4" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-center leading-relaxed">
                    Ask MIRA something
                    <br />
                    to see usage
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="bg-muted/30 border border-border rounded-2xl px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="size-3 text-mira-purple" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 font-bold">
                        Used
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-xl font-bold tabular-nums tracking-tight transition-colors",
                        busy ? "text-mira-purple" : "text-foreground"
                      )}
                    >
                      {usedTokens.toLocaleString()}
                      <span className="text-[10px] font-mono text-muted-foreground/40 ml-1">
                        tokens
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-2xl px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Hash className="size-3 text-emerald-500" />
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 font-bold">
                        Remaining
                      </span>
                    </div>
                    <div className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                      {remainingTokens.toLocaleString()}
                      <span className="text-[10px] font-mono text-muted-foreground/40 ml-1">
                        tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
                    Quota
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    {usedPct.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mira-purple rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-muted-foreground/30">
                  <span>0</span>
                  <span>1,000,000</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-3">
                <MetaLine icon={ShieldCheck} label="Identity" value="Secured" />
                <MetaLine icon={Hash} label="Protocol" value="Verified" />
                <MetaLine icon={Lock} label="Storage" value="Local" />
              </div>

              <div className="mt-auto p-4 rounded-2xl bg-muted/20 border border-border space-y-1.5">
                <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
                  <ShieldCheck className="size-3 text-emerald-500" /> Secure
                  Vault
                </div>
                <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                  Your conversations stay on your device. MIRA never stores your
                  data remotely.
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
const MetaLine = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex justify-between items-center text-[10px] font-mono group">
    <div className="flex items-center gap-2">
      <Icon className="size-3 text-muted-foreground/40 group-hover:text-mira-purple transition-colors" />
      <span className="text-muted-foreground/50 uppercase tracking-widest group-hover:text-muted-foreground/70 transition-colors font-bold">
        {label}
      </span>
    </div>
    <span className="text-foreground/60 group-hover:text-mira-purple transition-colors">
      {value}
    </span>
  </div>
);

export default AI;