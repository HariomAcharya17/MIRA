import { env } from "./env";

export class UserFacingError extends Error {
  status: number;
  code: string;
  retryAfter?: number;
  constructor(message: string, status = 500, code = "internal", retryAfter?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** Same-origin requests only, plus any extra origins in ALLOWED_ORIGINS. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin) return {};
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return {};
  }
  const allowed = originHost === host || env.allowedOrigins().includes(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/** Browsers always send Origin on cross-site POSTs; reject foreign ones. */
export function isForeignOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return Object.keys(corsHeaders(req)).length === 0;
}

export function json(req: Request, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req), ...extra },
  });
}

export function errorResponse(req: Request, err: unknown) {
  if (err instanceof UserFacingError) {
    const extra: Record<string, string> = {};
    if (err.retryAfter) extra["Retry-After"] = String(err.retryAfter);
    return json(req, { error: err.message, code: err.code, retryAfter: err.retryAfter }, err.status, extra);
  }
  console.error("[mira] unhandled", err);
  return json(req, { error: "Something went wrong on the server. Please try again.", code: "internal" }, 500);
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
