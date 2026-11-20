import type { ProjectFile } from "@/lib/mira-api";

export type TreeNode = {
  name: string;
  path: string;
  children?: TreeNode[];
};

export function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;
      node.children ||= [];
      let child = node.children.find((c) => c.name === part && Boolean(c.children) === !isFile);
      if (!child) {
        child = isFile ? { name: part, path } : { name: part, path, children: [] };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.children ? 0 : 1) - (b.children ? 0 : 1) || a.name.localeCompare(b.name));
    nodes.forEach((n) => n.children && sort(n.children));
    return nodes;
  };
  return sort(root.children || []);
}

const LANGS: Record<string, string> = {
  html: "xml", htm: "xml", xml: "xml", svg: "xml", vue: "xml",
  css: "css", scss: "scss", less: "less",
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "typescript", tsx: "typescript",
  json: "json", md: "markdown", py: "python", rb: "ruby", go: "go", rs: "rust",
  java: "java", kt: "kotlin", c: "c", h: "c", cpp: "cpp", cs: "csharp", php: "php",
  sh: "bash", yml: "yaml", yaml: "yaml", toml: "ini", sql: "sql", swift: "swift",
  dockerfile: "dockerfile",
};

export function languageFor(path: string): string {
  const name = path.split("/").pop()!.toLowerCase();
  if (name === "dockerfile") return "dockerfile";
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  return LANGS[ext] || "plaintext";
}

function resolvePath(fromFile: string, ref: string): string {
  const clean = ref.split(/[?#]/)[0];
  const base = fromFile.split("/").slice(0, -1);
  const parts = clean.startsWith("/") ? clean.slice(1).split("/") : [...base, ...clean.split("/")];
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

/** Finds the entry HTML file for a static web project, or null. */
export function findEntryHtml(files: ProjectFile[]): ProjectFile | null {
  const html = files.filter((f) => /\.html?$/i.test(f.path));
  if (!html.length) return null;
  return (
    html.find((f) => f.path.toLowerCase() === "index.html") ||
    html.find((f) => /(^|\/)(public\/)?index\.html$/i.test(f.path)) ||
    html.sort((a, b) => a.path.split("/").length - b.path.split("/").length)[0]
  );
}

const escapeClose = (s: string, tag: string) => s.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

/**
 * Builds a single HTML document for a sandboxed iframe: local stylesheets and
 * scripts are inlined. Runs only in the browser inside sandbox="allow-scripts"
 * (no same-origin), so generated code can't read the app's storage or cookies.
 */
export function buildPreview(files: ProjectFile[]): string | null {
  const entry = findEntryHtml(files);
  if (!entry) return null;
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  let html = entry.content;

  html = html.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || /^(https?:)?\/\//i.test(href)) return tag;
    const css = byPath.get(resolvePath(entry.path, href));
    return css != null ? `<style data-file="${href}">\n${escapeClose(css, "style")}\n</style>` : tag;
  });

  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, pre, src, post) => {
    if (/^(https?:)?\/\//i.test(src)) return tag;
    const js = byPath.get(resolvePath(entry.path, src));
    if (js == null) return tag;
    return `<script${pre}${post} data-file="${src}">\n${escapeClose(js, "script")}\n</script>`;
  });

  // Keep in-preview link clicks from navigating the frame away.
  const guard = `<script>document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(a&&a.getAttribute("href")&&!a.getAttribute("href").startsWith("#")){e.preventDefault();}},true);</script>`;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${guard}</body>`);
  else html += guard;
  return html;
}

export async function downloadZip(files: ProjectFile[], name: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const folder = zip.folder(name) ?? zip;
  for (const f of files) folder.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function projectName(files: ProjectFile[], fallback = "mira-project"): string {
  const pkg = files.find((f) => f.path === "package.json");
  if (pkg) {
    try {
      const n = JSON.parse(pkg.content).name;
      if (typeof n === "string" && n) return n.replace(/[^a-z0-9._-]/gi, "-").slice(0, 60);
    } catch {
      /* ignore */
    }
  }
  const title = findEntryHtml(files)?.content.match(/<title>([^<]{1,60})<\/title>/i)?.[1];
  if (title) return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
  return fallback;
}
