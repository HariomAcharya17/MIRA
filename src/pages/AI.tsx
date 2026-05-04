import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, Send, Trash2, Download, Plus, Sparkles, X } from "lucide-react";
import { NVIDIA_MODELS, callMira } from "@/lib/mira-api";
import { ChatMessage, ChatSession, addDownload, getUsage, recordUsage, upsertSession, downloadAsFile } from "@/lib/store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const newSessionId = () => `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const AI = () => {
  const [modelId, setModelId] = useState(NVIDIA_MODELS[0].id);
  const model = useMemo(() => NVIDIA_MODELS.find((m) => m.id === modelId)!, [modelId]);
  const [session, setSession] = useState<ChatSession>(() => ({
    id: newSessionId(),
    title: "New conversation",
    model: NVIDIA_MODELS[0].id,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState(getUsage());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pick up prompt from landing page
  useEffect(() => {
    const pending = sessionStorage.getItem("mira-pending-prompt");
    if (pending) {
      setInput(pending);
      sessionStorage.removeItem("mira-pending-prompt");
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session.messages, busy]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input.trim(), createdAt: Date.now() };
    const updated: ChatSession = {
      ...session,
      title: session.messages.length === 0 ? input.trim().slice(0, 60) : session.title,
      messages: [...session.messages, userMsg],
      model: modelId,
      updatedAt: Date.now(),
    };
    setSession(updated);
    setInput("");
    setBusy(true);

    try {
      const attachments = files.map((f) => ({ name: f.name, size: f.size }));
      const result = await callMira(
        model,
        updated.messages.map((m) => ({ role: m.role, content: m.content })),
        attachments
      );
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
        createdAt: Date.now(),
      };
      const finalSession: ChatSession = {
        ...updated,
        messages: [...updated.messages, assistantMsg],
        updatedAt: Date.now(),
      };
      setSession(finalSession);
      upsertSession(finalSession);
      recordUsage(model.id, result.promptTokens, result.completionTokens);
      setUsage(getUsage());
      setFiles([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const newChat = () => {
    setSession({
      id: newSessionId(),
      title: "New conversation",
      model: modelId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const exportChat = () => {
    if (session.messages.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    const md =
      `# ${session.title}\n\n_Model: ${model.name} · ${new Date(session.createdAt).toLocaleString()}_\n\n` +
      session.messages.map((m) => `## ${m.role === "user" ? "You" : "Mira"}\n\n${m.content}`).join("\n\n---\n\n");
    const filename = `mira-${session.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${session.id}.md`;
    downloadAsFile(filename, md, "text/markdown");
    addDownload({
      id: crypto.randomUUID(),
      name: filename,
      type: "text",
      content: md,
      size: md.length,
      createdAt: Date.now(),
    });
    toast.success("Chat exported and saved to Downloads.");
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).slice(0, 4);
    setFiles((prev) => [...prev, ...arr].slice(0, 4));
  };

  return (
    <Layout hideFooter>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Chat column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{session.title}</h1>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                  Session · {session.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={newChat} className="gap-1.5">
                  <Plus className="size-4" /> New
                </Button>
                <Button variant="outline" size="sm" onClick={exportChat} className="gap-1.5">
                  <Download className="size-4" /> Export
                </Button>
              </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[calc(100dvh-340px)] min-h-[460px]">
              <TrafficLights label={`${model.name} · ${model.contextWindow} ctx`} />

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {session.messages.length === 0 ? (
                  <EmptyState onPick={(p) => setInput(p)} />
                ) : (
                  session.messages.map((m) => <Message key={m.id} m={m} />)
                )}
                {busy && (
                  <div className="flex gap-3">
                    <div className="size-7 rounded-full bg-gradient-mira shrink-0 animate-pulse" />
                    <div className="text-sm text-muted-foreground italic font-mono">Thinking...</div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="border-t border-border/60 p-3 sm:p-4 space-y-3">
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs font-mono">
                        <Paperclip className="size-3" />
                        {f.name}
                        <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} aria-label="Remove">
                          <X className="size-3 hover:text-destructive" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger className="w-auto min-w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NVIDIA_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">· {m.category}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5 h-9">
                    <Paperclip className="size-4" /> Attach
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`Ask ${model.name} anything... (Shift+Enter for newline)`}
                    rows={2}
                    className="w-full resize-none bg-muted/40 border border-border rounded-lg px-4 py-3 pr-14 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <Button
                    onClick={send}
                    disabled={busy || !input.trim()}
                    size="icon"
                    className="absolute right-2 bottom-2 btn-mira size-9"
                    aria-label="Send"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel rounded-xl overflow-hidden">
              <TrafficLights label="usage / live" />
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-mira-purple" />
                  Usage Dashboard
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Total tokens" value={usage.totalTokens.toLocaleString()} />
                  <Stat label="Requests" value={usage.requests.toString()} />
                  <Stat label="Prompt" value={usage.promptTokens.toLocaleString()} />
                  <Stat label="Completion" value={usage.completionTokens.toLocaleString()} />
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">14-day usage</div>
                  <Sparkbars data={usage.history.map((h) => h.tokens)} />
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">By model</div>
                  <div className="space-y-2">
                    {Object.keys(usage.byModel).length === 0 && (
                      <div className="text-xs text-muted-foreground">No usage yet — send your first message.</div>
                    )}
                    {Object.entries(usage.byModel).map(([id, v]) => {
                      const m = NVIDIA_MODELS.find((x) => x.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span className="truncate font-medium">{m?.name ?? id}</span>
                          <span className="font-mono text-muted-foreground">{v.tokens.toLocaleString()} tok</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => {
                    if (!confirm("Reset all usage stats?")) return;
                    localStorage.removeItem("mira-usage");
                    setUsage(getUsage());
                    toast.success("Usage reset.");
                  }}
                >
                  <Trash2 className="size-3.5" /> Reset usage
                </Button>
              </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
              <TrafficLights label="model / details" />
              <div className="p-5 space-y-2 text-sm">
                <div className="font-semibold">{model.name}</div>
                <div className="text-muted-foreground text-xs">{model.description}</div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <Field label="ID" value={model.id} mono />
                  <Field label="Context" value={model.contextWindow} mono />
                  <Field label="Category" value={model.category} mono />
                  <Field label="Status" value="Stub · add API key" mono />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const EmptyState = ({ onPick }: { onPick: (p: string) => void }) => {
  const samples = [
    "Implement a vision transformer in PyTorch",
    "Compare Bayesian vs frequentist hypothesis testing",
    "Design a system architecture for a real-time search engine",
    "Generate a logo concept for a quantum computing startup",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="size-16 rounded-full bg-gradient-mira opacity-90 shadow-[0_0_60px_hsl(var(--mira-purple)/0.5)] mb-6 animate-float" />
      <h2 className="text-2xl font-semibold tracking-tight mb-2">How can I help?</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Choose a model, then ask anything. Try one of these to get started:
      </p>
      <div className="grid sm:grid-cols-2 gap-2 w-full max-w-xl">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left p-3 rounded-lg border border-border hover:border-mira-purple/60 hover:bg-muted/40 transition-colors text-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

const Message = ({ m }: { m: ChatMessage }) => (
  <div className="flex gap-3 animate-fade-in">
    <div
      className={`size-7 rounded-full shrink-0 ${
        m.role === "user" ? "bg-muted border border-border" : "bg-gradient-mira shadow-[0_0_15px_hsl(var(--mira-purple)/0.4)]"
      }`}
    />
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
        {m.role === "user" ? "You" : "Mira"}
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-mira-purple prose-headings:text-foreground">
        <ReactMarkdown>{m.content}</ReactMarkdown>
      </div>
    </div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold mt-0.5 truncate">{value}</div>
  </div>
);

const Field = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="rounded bg-muted/30 border border-border/60 p-2">
    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className={`text-xs truncate ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>
);

const Sparkbars = ({ data }: { data: number[] }) => {
  const max = Math.max(1, ...data);
  const padded = [...Array(Math.max(0, 14 - data.length)).fill(0), ...data];
  return (
    <div className="flex items-end gap-1 h-16">
      {padded.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-mira-blue to-mira-purple opacity-80"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          title={`${v.toLocaleString()} tokens`}
        />
      ))}
    </div>
  );
};

export default AI;
