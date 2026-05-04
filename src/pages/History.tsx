import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { TrafficLights } from "@/components/TrafficLights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MessageSquare, Search } from "lucide-react";
import { ChatSession, deleteSession, getSessions } from "@/lib/store";
import { NVIDIA_MODELS } from "@/lib/mira-api";
import { toast } from "sonner";

const HistoryPage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(getSessions());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<ChatSession | null>(null);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase()))
  );

  const remove = (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    deleteSession(id);
    setSessions(getSessions());
    if (open?.id === id) setOpen(null);
    toast.success("Deleted.");
  };

  const clearAll = () => {
    if (!confirm("Delete ALL conversations? This cannot be undone.")) return;
    localStorage.removeItem("mira-sessions");
    setSessions([]);
    setOpen(null);
    toast.success("History cleared.");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">History</h1>
            <p className="text-sm text-muted-foreground mt-1">{sessions.length} saved conversation{sessions.length === 1 ? "" : "s"}</p>
          </div>
          {sessions.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="gap-2">
              <Trash2 className="size-4" /> Clear all
            </Button>
          )}
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations..." className="pl-9" />
        </div>

        {sessions.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <MessageSquare className="size-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">Start chatting with Mira to build your history.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {filtered.map((s) => {
              const m = NVIDIA_MODELS.find((x) => x.id === s.model);
              return (
                <div
                  key={s.id}
                  className="glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => setOpen(s)}
                >
                  <TrafficLights label={`${m?.name ?? s.model} · ${s.messages.length} msg`} />
                  <div className="p-5">
                    <h3 className="font-semibold mb-1 line-clamp-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground font-mono mb-3">
                      {new Date(s.updatedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {s.messages[s.messages.length - 1]?.content ?? "Empty conversation"}
                    </p>
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(null)}>
            <div className="glass-panel rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <TrafficLights label={open.title} />
              <div className="overflow-y-auto p-6 space-y-4">
                {open.messages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{m.role}</div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 p-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setOpen(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
