// Server-only environment access. Never import this from src/ (client code).

export type ProviderId = "groq" | "nvidia";

export const env = {
  groqKey: () => process.env.GROQ_API_KEY || "",
  nvidiaKey: () => process.env.NVIDIA_API_KEY || "",
  tavilyKey: () => process.env.TAVILY_API_KEY || "",
  allowedOrigins: () =>
    (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
};

export function providerKey(p: ProviderId): string {
  return p === "groq" ? env.groqKey() : env.nvidiaKey();
}

let warned = false;
/** Logs missing variables once per instance. Names only, never values. */
export function checkEnvOnce() {
  if (warned) return;
  warned = true;
  const missing: string[] = [];
  if (!env.groqKey()) missing.push("GROQ_API_KEY");
  if (!env.nvidiaKey()) missing.push("NVIDIA_API_KEY");
  if (!env.tavilyKey()) missing.push("TAVILY_API_KEY");
  if (missing.length) console.warn(`[mira] missing env: ${missing.join(", ")}`);
  if (!env.groqKey() && !env.nvidiaKey()) {
    console.error("[mira] no model provider key set; chat will fail");
  }
}
