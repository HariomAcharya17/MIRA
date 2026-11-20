export type ProjectFile = { path: string; content: string };

const MAX_FILES = 80;
const MAX_TOTAL_BYTES = 600_000;
const PATH_RE = /^[A-Za-z0-9._@()+\- ]+(\/[A-Za-z0-9._@()+\- ]+)*$/;

/** Extracts a JSON array from model output (tolerates code fences / stray prose). */
function extractJson(raw: string): unknown {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1].trim().startsWith("[")) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(text.slice(objStart, objEnd + 1));
    } catch {
      /* fall through */
    }
  }
  return undefined;
}

export type ValidationResult = { ok: true; files: ProjectFile[] } | { ok: false; reason: string };

export function parseProject(raw: string): ValidationResult {
  let data = extractJson(raw);
  if (data && !Array.isArray(data) && typeof data === "object" && Array.isArray((data as { files?: unknown }).files))
    data = (data as { files: unknown[] }).files;
  if (!Array.isArray(data)) return { ok: false, reason: "not a JSON array" };
  if (data.length === 0) return { ok: false, reason: "empty array" };
  if (data.length > MAX_FILES) return { ok: false, reason: `too many files (${data.length})` };

  const seen = new Set<string>();
  const files: ProjectFile[] = [];
  let total = 0;
  for (const item of data) {
    if (!item || typeof item !== "object") return { ok: false, reason: "item is not an object" };
    const { path, content } = item as { path?: unknown; content?: unknown };
    if (typeof path !== "string" || typeof content !== "string")
      return { ok: false, reason: "path and content must be strings" };
    const clean = path.trim().replace(/\\/g, "/").replace(/^\.\//, "");
    if (!clean || clean.startsWith("/") || clean.split("/").some((s) => s === ".." || s === ".") || !PATH_RE.test(clean))
      return { ok: false, reason: `unsafe path "${path.slice(0, 80)}"` };
    if (seen.has(clean)) return { ok: false, reason: `duplicate path "${clean}"` };
    seen.add(clean);
    total += content.length;
    files.push({ path: clean, content });
  }
  if (total > MAX_TOTAL_BYTES) return { ok: false, reason: "project too large" };
  return { ok: true, files };
}
