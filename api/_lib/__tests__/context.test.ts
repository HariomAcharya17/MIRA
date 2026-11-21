// @vitest-environment node
import { describe, expect, it } from "vitest";
import { estimateTokens, fitHistory, transcript } from "../context";
import type { ChatMsg } from "../providers";

const msg = (role: "user" | "assistant", chars: number, ch = "a"): ChatMsg => ({ role, content: ch.repeat(chars) });

describe("estimateTokens", () => {
  it("uses about 3.5 characters per token for Latin text, plus 4", () => {
    expect(estimateTokens("")).toBe(4);
    expect(estimateTokens("a".repeat(35))).toBe(14);
  });

  it("counts non-Latin scripts (Hindi, Gujarati) as more tokens per character", () => {
    expect(estimateTokens("न".repeat(30))).toBeGreaterThan(estimateTokens("a".repeat(30)));
    expect(estimateTokens("न".repeat(30))).toBe(24);
  });
});

describe("fitHistory", () => {
  it("keeps everything when it fits", () => {
    const h = [msg("user", 35), msg("assistant", 35), msg("user", 35)];
    expect(fitHistory(h, 1000)).toEqual({ kept: h, dropped: [] });
  });

  it("drops the oldest messages first and always keeps the latest user message", () => {
    const h = [msg("user", 350), msg("assistant", 350), msg("user", 350), msg("assistant", 350), msg("user", 35)];
    const { kept, dropped } = fitHistory(h, 250);
    expect(kept[kept.length - 1]).toEqual(h[4]);
    expect(dropped.length + kept.length).toBe(h.length);
    expect(dropped[0]).toBe(h[0]);
    expect(kept.reduce((n, m) => n + estimateTokens(m.content), 0)).toBeLessThanOrEqual(250);
  });

  it("never starts the kept window with an assistant turn", () => {
    const h = [msg("user", 700), msg("assistant", 70), msg("user", 35)];
    const { kept } = fitHistory(h, 60);
    expect(kept[0].role).toBe("user");
  });

  it("truncates the latest message in the middle if it alone is too big", () => {
    const { kept } = fitHistory([msg("user", 50_000)], 1000);
    expect(kept[0].content).toContain("characters omitted");
    expect(kept[0].content.length).toBeLessThan(50_000);
  });

  it("returns empty arrays for an empty history", () => {
    expect(fitHistory([], 100)).toEqual({ kept: [], dropped: [] });
  });
});

describe("transcript", () => {
  it("labels turns as User and Assistant", () => {
    expect(transcript([{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }], 100)).toBe("User: hi\n\nAssistant: hello");
  });
});
