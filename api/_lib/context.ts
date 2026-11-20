import type { ChatMsg } from "./providers";

/** Rough token estimate. ~3.5 chars/token for English; conservative for other scripts. */
export function estimateTokens(text: string): number {
  // Non-Latin scripts (Devanagari, Gujarati, CJK...) use more tokens per char.
  let nonLatin = 0;
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) > 0x24f) nonLatin++;
  return Math.ceil((text.length - nonLatin) / 3.5 + nonLatin / 1.5) + 4;
}

export function messagesTokens(msgs: ChatMsg[]): number {
  return msgs.reduce((n, m) => n + estimateTokens(m.content), 0);
}

function truncateMiddle(text: string, maxTokens: number): string {
  if (estimateTokens(text) <= maxTokens) return text;
  const keep = Math.max(200, Math.floor(maxTokens * 3));
  const head = text.slice(0, Math.floor(keep * 0.6));
  const tail = text.slice(-Math.floor(keep * 0.4));
  return `${head}\n\n[… ${text.length - head.length - tail.length} characters omitted …]\n\n${tail}`;
}

/**
 * Keeps the newest messages that fit in `budget` tokens. The latest user
 * message is always kept (truncated if it alone is too big).
 * Returns the kept messages and the older ones that were dropped.
 */
export function fitHistory(history: ChatMsg[], budget: number): { kept: ChatMsg[]; dropped: ChatMsg[] } {
  if (!history.length) return { kept: [], dropped: [] };
  const last = history[history.length - 1];
  const lastFitted = { ...last, content: truncateMiddle(last.content, Math.floor(budget * 0.8)) };
  let used = estimateTokens(lastFitted.content);
  const kept: ChatMsg[] = [lastFitted];
  let i = history.length - 2;
  for (; i >= 0; i--) {
    const t = estimateTokens(history[i].content);
    if (used + t > budget) break;
    used += t;
    kept.unshift(history[i]);
  }
  // Don't start the window with an assistant turn.
  while (kept.length > 1 && kept[0].role === "assistant") {
    kept.shift();
    i++;
  }
  return { kept, dropped: history.slice(0, i + 1) };
}

export function transcript(msgs: ChatMsg[], maxTokens: number): string {
  const text = msgs.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
  return truncateMiddle(text, maxTokens);
}
