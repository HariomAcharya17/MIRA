import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MessageSquare, Search } from "lucide-react";
import { ChatSession, deleteSession, getSessions } from "@/lib/store";
import { MIRA_MODELS } from "@/lib/mira-api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const HistoryPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<ChatSession | null>(null);

  // Re-fetch sessions whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setOpen(null);
      return;
    }
    setSessions(getSessions());
  }, [user]);

  const filtered = sessions.filter((s) =>
    MIRA_MODELS.some(m => m.id === s.model) && (
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase()))
    )
  );

  const remove = (id: string) => {
    if (!confirm("Decommission this log entry?")) return;
    deleteSession(id);
    setSessions(getSessions());
    if (open?.id === id) setOpen(null);
    toast.success("Entry decommissioned.");
  };

  const clearAll = () => {
    if (!confirm("Wipe all telemetry logs? This action is irreversible.")) return;
    localStorage.removeItem("mira-sessions");
    setSessions([]);
    setOpen(null);
    toast.success("Telemetry logs wiped.");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple mb-2 flex items-center gap-2">
              <span className="size-1 bg-mira-purple rounded-full animate-pulse" />
              Neural Log Archive
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter">Session History</h1>
            <p className="text-sm text-muted-foreground mt-2 font-light">
              {sessions.length} recorded transmissions found in local cache.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search telemetry..."
                className="pl-9 h-10 bg-white/[0.02] border-white/5 focus:border-mira-purple/30 transition-all text-xs"
              />
            </div>
            {sessions.length > 0 && (
              <Button variant="outline" onClick={clearAll} className="h-10 gap-2 border-white/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all">
                <Trash2 className="size-3.5" /> <span className="hidden sm:inline">Wipe Logs</span>
              </Button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center border-white/5 border-dashed">
            <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="size-8 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Archive Empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-light">No neural transmissions have been logged. Initialize your first session to begin indexing.</p>
            <Button variant="outline" className="mt-8 border-white/10" asChild>
              <a href="/ai">Initialize Session</a>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((s, i) => {
              const m = MIRA_MODELS.find((x) => x.id === s.model);
              return (
                <div
                  key={s.id}
                  className="glass-panel rounded-2xl overflow-hidden cursor-pointer group hover:border-mira-purple/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => setOpen(s)}
                >
                  <TrafficLights label={`${m?.name ?? s.model} // 0x${s.id.slice(2, 8).toUpperCase()}`} />
                  <div className="p-6">
                    <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-mira-purple transition-colors">{s.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
                      <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                      <span className="size-1 bg-white/20 rounded-full" />
                      <span>{s.messages.length} Units</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      {s.messages[s.messages.length - 1]?.content ?? "No telemetry data recorded."}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[9px] font-mono uppercase text-mira-cyan">Verified Log</span>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setOpen(null)}>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500" />
            <div className="relative glass-panel rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
              <TrafficLights label={open.title} />
              <div className="overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar">
                {open.messages.map((m) => (
                  <div key={m.id} className="space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mira-purple flex items-center gap-2">
                      <span className="size-1 bg-mira-purple rounded-full" />
                      {m.role === "user" ? "Operator" : "Neural Link"}
                    </div>
                    <div className="text-sm font-light leading-relaxed text-foreground/90 bg-white/[0.02] p-5 rounded-xl border border-white/5 whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 p-4 bg-white/[0.01] flex justify-between items-center">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest ml-4">End of Transmission</span>
                <Button variant="outline" size="sm" onClick={() => setOpen(null)} className="border-white/10 px-6">Close Archive</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;