// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseProject } from "../project";

const files = (arr: unknown) => JSON.stringify(arr);

describe("parseProject", () => {
  it("accepts a plain JSON array of files", () => {
    const r = parseProject(files([{ path: "index.html", content: "<h1>hi</h1>" }, { path: "src/app.js", content: "1" }]));
    expect(r).toEqual({ ok: true, files: [{ path: "index.html", content: "<h1>hi</h1>" }, { path: "src/app.js", content: "1" }] });
  });

  it("extracts JSON from a code fence or surrounding prose", () => {
    const fenced = parseProject("```json\n" + files([{ path: "a.txt", content: "x" }]) + "\n```");
    const prose = parseProject("Here you go:\n" + files([{ path: "a.txt", content: "x" }]) + "\nEnjoy!");
    expect(fenced.ok).toBe(true);
    expect(prose.ok).toBe(true);
  });

  it("accepts an object with a files array", () => {
    expect(parseProject(JSON.stringify({ files: [{ path: "a.md", content: "# A" }] })).ok).toBe(true);
  });

  it("normalises ./ prefixes and backslashes", () => {
    const r = parseProject(files([{ path: "./src\\main.ts", content: "" }]));
    expect(r.ok && r.files[0].path).toBe("src/main.ts");
  });

  it.each([
    ["../secret.txt", "parent directory"],
    ["src/../../etc/passwd", "parent directory inside the path"],
    ["/etc/passwd", "absolute path"],
    ["src/./a.js", "dot segment"],
    ["a<b>.js", "unsafe characters"],
  ])("rejects unsafe path %s (%s)", (path) => {
    const r = parseProject(files([{ path, content: "x" }]));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/unsafe path/);
  });

  it("rejects duplicates, non-strings, empty arrays and non-arrays", () => {
    expect(parseProject(files([{ path: "a.js", content: "" }, { path: "a.js", content: "" }]))).toMatchObject({ ok: false, reason: expect.stringMatching(/duplicate/) });
    expect(parseProject(files([{ path: "a.js", content: 5 }]))).toMatchObject({ ok: false, reason: expect.stringMatching(/strings/) });
    expect(parseProject("[]")).toEqual({ ok: false, reason: "empty array" });
    expect(parseProject("not json at all")).toEqual({ ok: false, reason: "not a JSON array" });
  });

  it("enforces the 80-file and 600,000-character limits", () => {
    const many = Array.from({ length: 81 }, (_, i) => ({ path: `f${i}.txt`, content: "" }));
    expect(parseProject(files(many))).toMatchObject({ ok: false, reason: expect.stringMatching(/too many files/) });
    const big = [{ path: "a.txt", content: "x".repeat(300_001) }, { path: "b.txt", content: "x".repeat(300_000) }];
    expect(parseProject(files(big))).toEqual({ ok: false, reason: "project too large" });
  });
});
