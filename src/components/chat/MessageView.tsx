import { memo, useState } from "react";
import { AlertCircle, ChevronRight, FolderTree, Globe, Info, RotateCcw } from "lucide-react";
import type { ChatMessage } from "@/lib/store";
import { Markdown, CopyButton } from "./Markdown";
import { cn } from "@/lib/utils";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Sources({ sources }: { sources: NonNullable<ChatMessage["sources"]> }) {
  const [open, setOpen] = useState(false);
  const shown = open ? sources : sources.slice(0, 3);
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Globe className="size-3.5" /> Sources
      </div>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {shown.map((s, i) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-start gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className="line-clamp-1 text-foreground">{s.title}</span>
                <span className="line-clamp-1 text-muted-foreground">{hostOf(s.url)}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      {sources.length > 3 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {open ? "Show fewer" : `Show all ${sources.length}`}
        </button>
      )}
    </div>
  );
}

/**
 * Normalises citation markers outside code blocks: gpt-oss style "【2†L1-L4】" or "【2】"
 * becomes "[2]", and "[n]" becomes a link to the n-th search source.
 */
function linkCitations(text: string, sources?: ChatMessage["sources"]): string {
  const link = (n: string, fallback: string) => {
    const s = sources?.[Number(n) - 1];
    return s ? `[[${n}]](${s.url})` : fallback;
  };
  return text
    .split(/(```[\s\S]*?(?:```|$))/g)
    .map((part, i) => {
      if (i % 2 === 1) return part; // code block
      // 【n】 markers are always citations, even when glued to a word.
      let out = part.replace(/【(\d+)(?:†[^】]*)?】/g, (_m, n) => link(n, `[${n}]`));
      // Plain [n] only when not part of an identifier like arr[1].
      out = out.replace(/(?<![\w`\]])\[(\d{1,2})\](?![(:\]`])/g, (m, n) => link(n, m));
      return out;
    })
    .join("");
}

export const MessageView = memo(function MessageView({
  m,
  streaming,
  progress,
  isLast,
  onRegenerate,
  onOpenProject,
}: {
  m: ChatMessage;
  streaming: boolean;
  progress?: { files: number; chars: number } | null;
  isLast: boolean;
  onRegenerate?: () => void;
  onOpenProject?: () => void;
}) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-accent px-4 py-2.5 text-[0.9375rem] leading-relaxed">
          {m.content}
        </div>
      </div>
    );
  }

  const empty = !m.content && !m.project;
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Mira</span>
        {m.model && <span className="truncate">{m.model}</span>}
      </div>

      {m.notices?.map((n, i) => (
        <div key={i} className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>{n}</span>
        </div>
      ))}

      {m.reasoning && (
        <details className="mb-2 text-xs text-muted-foreground [&_summary::-webkit-details-marker]:hidden">
          <summary className="inline-flex cursor-pointer select-none items-center gap-1 hover:text-foreground">
            <ChevronRight className="size-3.5 transition-transform [details[open]_&]:rotate-90" />
            {streaming && !m.content ? "Thinking…" : "Reasoning"}
          </summary>
          <div className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap border-l-2 border-border pl-3 leading-relaxed">
            {m.reasoning}
          </div>
        </details>
      )}

      {streaming && empty && !progress && (
        <div className="mira-typing py-2" aria-label="Mira is typing">
          <span />
          <span />
          <span />
        </div>
      )}
      {streaming && progress && !m.project && (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <div className="mira-typing">
            <span />
            <span />
            <span />
          </div>
          Writing project… {progress.files > 0 ? `${progress.files} file${progress.files === 1 ? "" : "s"} so far` : ""}
        </div>
      )}

      {m.content && <Markdown content={linkCitations(m.content, m.sources)} />}

      {m.project && (
        <button
          type="button"
          onClick={onOpenProject}
          className="mt-3 flex w-full max-w-sm items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent transition-colors"
        >
          <FolderTree className="size-5 text-brand" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Open project</span>
            <span className="block text-xs text-muted-foreground">
              {m.project.length} files · code, preview, ZIP
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      )}

      {m.error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span className="flex-1">{m.error}</span>
        </div>
      )}

      {m.sources && m.sources.length > 0 && <Sources sources={m.sources} />}

      {!streaming && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1",
            isLast ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
          )}
        >
          {m.content && <CopyButton text={m.content} />}
          {isLast && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
});
