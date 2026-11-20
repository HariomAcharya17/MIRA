import { Link } from "react-router-dom";
import { Download, LogOut, Monitor, Moon, Plus, Sun, Trash2, User as UserIcon } from "lucide-react";
import type { ChatSession } from "@/lib/store";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

function groupLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const day = 86_400_000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfToday - day) return "Yesterday";
  if (ts >= startOfToday - 7 * day) return "Previous 7 days";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  userName,
  onLogout,
}: {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  userName?: string;
  onLogout: () => void;
}) {
  const { preference, setPreference } = useTheme();
  const groups: { label: string; items: ChatSession[] }[] = [];
  for (const s of sessions) {
    if (!s.messages.length) continue;
    const label = groupLabel(s.updatedAt);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(s);
    else groups.push({ label, items: [s] });
  }

  const themes: { id: ThemePreference; icon: typeof Sun; label: string }[] = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center justify-between px-3 shrink-0">
        <Link to="/" className="px-2 text-[15px] font-semibold tracking-tight">
          Mira
        </Link>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Plus className="size-3.5" /> New chat
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Chat history">
        {groups.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">No chats yet.</p>}
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <div className="px-2 pb-1 pt-2 text-[11px] font-medium text-muted-foreground">{g.label}</div>
            <ul>
              {g.items.map((s) => (
                <li key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={cn(
                      "block w-full truncate rounded-md px-2 py-1.5 pr-8 text-left text-[13px]",
                      s.id === activeId ? "bg-accent text-foreground" : "text-foreground/80 hover:bg-accent/70",
                    )}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-100 sm:opacity-0 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete chat ${s.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2 space-y-1 shrink-0">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <div className="flex rounded-md border border-border p-0.5" role="radiogroup" aria-label="Theme">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={preference === t.id}
                title={t.label}
                onClick={() => setPreference(t.id)}
                className={cn(
                  "rounded p-1",
                  preference === t.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
        <Link to="/downloads" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground/80 hover:bg-accent">
          <Download className="size-4" /> Downloads
        </Link>
        <Link to="/account" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground/80 hover:bg-accent">
          <UserIcon className="size-4" /> <span className="truncate">{userName || "Account"}</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground/80 hover:bg-accent"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
