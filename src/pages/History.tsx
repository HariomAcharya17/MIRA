import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatSession, clearSessions, deleteSession, getSessions } from "@/lib/store";
import { deleteAllRemoteSessions, deleteRemoteSession } from "@/lib/chat-sync";
import { useAuth } from "@/contexts/AuthContext";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const HistoryPage = () => {
  const { user, isMock } = useAuth();
  const navigate = useNavigate();
  const remote = Boolean(user && !isMock);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [query, setQuery] = useState("");

  // Re-read sessions whenever the signed-in user changes (storage is per user).
  useEffect(() => {
    setSessions(user ? getSessions() : []);
  }, [user]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter(
        (s) => s.title.toLowerCase().includes(q) || s.messages.some((m) => m.content.toLowerCase().includes(q)),
      )
    : sessions;

  const remove = (id: string) => {
    if (!confirm("Delete this chat? This can't be undone.")) return;
    deleteSession(id);
    if (remote) deleteRemoteSession(id).catch(() => {});
    setSessions(getSessions());
    toast.success("Chat deleted.");
  };

  const clearAll = () => {
    if (!confirm("Delete all chats? This can't be undone.")) return;
    clearSessions();
    if (remote) deleteAllRemoteSessions().catch(() => {});
    setSessions([]);
    toast.success("All chats deleted.");
  };

  const open = (id: string) => navigate(`/ai?s=${encodeURIComponent(id)}`);

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">History</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? "chat" : "chats"}
            </p>
          </div>
          {sessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive self-start sm:self-auto">
              Delete all
            </Button>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="pl-9"
            />
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="font-medium">No chats yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Conversations you start will show up here.</p>
            <Button asChild className="mt-6">
              <Link to="/ai">Start a chat</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground text-center">No chats match "{query}".</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {filtered.map((s) => {
              const last = [...s.messages].reverse().find((m) => m.role === "assistant") ?? s.messages[s.messages.length - 1];
              return (
                <li key={s.id} className="group flex items-start gap-3">
                  <button onClick={() => open(s.id)} className="flex-1 min-w-0 text-left py-4 px-1 hover:bg-accent/50 rounded-md transition-colors">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium truncate">{s.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatDate(s.updatedAt)}</span>
                    </div>
                    {last && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{last.content}</p>}
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {s.messages.length} {s.messages.length === 1 ? "message" : "messages"}
                      {s.model ? ` · ${s.model}` : ""}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(s.id)}
                    aria-label={`Delete "${s.title}"`}
                    className="mt-3 size-8 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
