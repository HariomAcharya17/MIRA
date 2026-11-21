// @vitest-environment node
import { describe, expect, it } from "vitest";
import { shouldSkipSearch } from "../search";

describe("shouldSkipSearch", () => {
  it.each(["hi", "Hello!", "heyyy", "thanks", "thank you", "ok", "namaste", "kem cho", "bye", "who made you?", "tane kone banavyo"])(
    "skips small talk and identity questions: %s",
    (q) => expect(shouldSkipSearch(q)).toBe(true),
  );

  it("skips empty input", () => {
    expect(shouldSkipSearch("   ")).toBe(true);
  });

  it.each(["What is the latest version of React?", "hi, what's the weather in Ahmedabad today?", "Explain noisy-OR"])(
    "searches for real questions: %s",
    (q) => expect(shouldSkipSearch(q)).toBe(false),
  );
});
