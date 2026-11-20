import { useEffect, useRef } from "react";
import { ArrowUp, Globe, Square, FolderTree } from "lucide-react";
import { MODES, type Mode } from "@/lib/mira-api";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  disabled,
  mode,
  onMode,
  project,
  onProject,
  search,
  onSearch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  mode: Mode;
  onMode: (m: Mode) => void;
  project: boolean;
  onProject: (v: boolean) => void;
  search: boolean;
  onSearch: (v: boolean) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const searchForced = mode === "research";
  const pill = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
      active
        ? "border-brand/40 bg-brand-soft text-foreground"
        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="rounded-2xl border border-input bg-card focus-within:border-ring/60 transition-colors">
      <textarea
        ref={ref}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!busy) onSend();
          }
        }}
        placeholder={
          project ? "Describe the project to build…" : mode === "code" ? "Ask a coding question…" : "Message Mira…"
        }
        aria-label="Message"
        className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[0.9375rem] leading-relaxed outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2 px-2 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
        <div className="flex shrink-0 items-center gap-0.5" role="radiogroup" aria-label="Mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              title={m.hint}
              onClick={() => onMode(m.id)}
              className={cn(
                "rounded-md px-2 py-1 text-xs transition-colors whitespace-nowrap",
                mode === m.id ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mx-1 h-4 w-px shrink-0 bg-border" />
        {mode === "code" && (
          <button
            type="button"
            aria-pressed={project}
            onClick={() => onProject(!project)}
            className={pill(project)}
            title="Generate a full multi-file project you can preview and download"
          >
            <FolderTree className="size-3.5" /> Project
          </button>
        )}
        <button
          type="button"
          aria-pressed={search || searchForced}
          disabled={searchForced}
          onClick={() => onSearch(!search)}
          className={cn(pill(search || searchForced), "disabled:cursor-default")}
          title={searchForced ? "Research mode always searches the web" : "Search the web for every message"}
        >
          <Globe className="size-3.5" /> Web
        </button>
        </div>
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            aria-label="Stop generating"
            title="Stop generating"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground hover:opacity-90 disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
