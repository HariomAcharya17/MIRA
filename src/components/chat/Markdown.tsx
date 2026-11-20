import { memo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${className}`}
      aria-label={done ? "Copied" : label}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span>{done ? "Copied" : label}</span>
    </button>
  );
}

const components: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;
    const className =
      (child && typeof child === "object" && "props" in child && (child.props as { className?: string }).className) || "";
    const lang = /language-([\w+#-]+)/.exec(className)?.[1] ?? "";
    const code = textOf(children).replace(/\n$/, "");
    return (
      <div className="my-4 overflow-hidden rounded-lg border border-border bg-code-bg not-prose">
        <div className="flex items-center justify-between border-b border-border px-3 py-1">
          <span className="text-xs text-muted-foreground font-mono">{lang || "text"}</span>
          <CopyButton text={code} />
        </div>
        <pre className="mira-code overflow-x-auto p-4">{children}</pre>
      </div>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );
  },
};

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="mira-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
