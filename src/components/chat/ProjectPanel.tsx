import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/common";
import { ChevronDown, ChevronRight, Download, File, Folder, RotateCw, X } from "lucide-react";
import type { ProjectFile } from "@/lib/mira-api";
import { buildPreview, buildTree, downloadZip, languageFor, projectName, type TreeNode } from "@/lib/project";
import { CopyButton } from "./Markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function Tree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: TreeNode[];
  selected: string;
  onSelect: (p: string) => void;
  depth?: number;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <ul>
      {nodes.map((n) =>
        n.children ? (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [n.path]: !c[n.path] }))}
              className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[13px] text-muted-foreground hover:bg-accent"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              {closed[n.path] ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              <Folder className="size-3.5" />
              <span className="truncate">{n.name}</span>
            </button>
            {!closed[n.path] && <Tree nodes={n.children} selected={selected} onSelect={onSelect} depth={depth + 1} />}
          </li>
        ) : (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => onSelect(n.path)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[13px] hover:bg-accent",
                selected === n.path ? "bg-accent text-foreground font-medium" : "text-muted-foreground",
              )}
              style={{ paddingLeft: 22 + depth * 12 }}
            >
              <File className="size-3.5 shrink-0" />
              <span className="truncate">{n.name}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

function CodeView({ file }: { file: ProjectFile }) {
  const html = useMemo(() => {
    const lang = languageFor(file.path);
    if (file.content.length > 200_000 || !hljs.getLanguage(lang)) return null;
    try {
      return hljs.highlight(file.content, { language: lang, ignoreIllegals: true }).value;
    } catch {
      return null;
    }
  }, [file]);
  return (
    <pre className="mira-code min-h-full p-4 overflow-auto">
      {html ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{file.content}</code>}
    </pre>
  );
}

export function ProjectPanel({ files, onClose }: { files: ProjectFile[]; onClose: () => void }) {
  const tree = useMemo(() => buildTree(files), [files]);
  const preview = useMemo(() => buildPreview(files), [files]);
  const name = useMemo(() => projectName(files), [files]);
  const [tab, setTab] = useState<"code" | "preview">(preview ? "preview" : "code");
  const [selected, setSelected] = useState(
    () => (files.find((f) => /(^|\/)index\.html$/i.test(f.path)) || files.find((f) => !/readme/i.test(f.path)) || files[0]).path,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [showTree, setShowTree] = useState(true);
  const file = files.find((f) => f.path === selected) ?? files[0];

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 h-12 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{name}</div>
        </div>
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          {(["code", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={t === "preview" && !preview}
              onClick={() => setTab(t)}
              title={t === "preview" && !preview ? "Preview needs an index.html (static HTML/CSS/JS)" : undefined}
              className={cn(
                "rounded px-2.5 py-1 capitalize disabled:opacity-40",
                tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            downloadZip(files, name).catch(() => toast.error("Couldn't build the ZIP file."))
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
        >
          <Download className="size-3.5" /> <span className="hidden sm:inline">Download ZIP</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close project"
        >
          <X className="size-4" />
        </button>
      </div>

      {tab === "code" ? (
        <div className="flex min-h-0 flex-1">
          {showTree && (
            <nav className="w-48 sm:w-56 shrink-0 overflow-y-auto border-r border-border bg-sidebar py-2">
              <Tree nodes={tree} selected={selected} onSelect={setSelected} />
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowTree((s) => !s)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showTree ? "Hide files" : "Files"}
              </button>
              <span className="truncate font-mono text-xs text-muted-foreground flex-1">{file.path}</span>
              <CopyButton text={file.content} label="Copy file" />
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-code-bg">
              <CodeView file={file} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground shrink-0">
            <span className="flex-1">Sandboxed preview. Scripts run isolated from Mira.</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <RotateCw className="size-3.5" /> Reload
            </button>
          </div>
          <iframe
            key={reloadKey}
            title={`${name} preview`}
            sandbox="allow-scripts"
            srcDoc={preview ?? ""}
            className="min-h-0 flex-1 w-full bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}
