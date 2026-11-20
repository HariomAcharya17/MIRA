// POST /api/chat — streams a reply as Server-Sent Events.
// Body: { provider, model, mode, project?, search?, messages, summary? }
// Events (data: JSON): meta, notice, sources, summary, delta, reasoning,
// progress, project, usage, error, done.
import { checkEnvOnce, ProviderId, providerKey } from "./_lib/env";
import { clientIp, corsHeaders, errorResponse, isForeignOrigin, json, UserFacingError } from "./_lib/http";
import { enforceRateLimit } from "./_lib/ratelimit";
import { formatSearchContext, shouldSkipSearch, tavilyUsage, webSearch, SearchResult } from "./_lib/search";
import {
  ChatMsg,
  complete,
  listModels,
  pickFallback,
  PROVIDERS,
  readCompletionStream,
  tokenCeiling,
  UpstreamError,
} from "./_lib/providers";
import { Mode, MODES, PROJECT_FIX_PROMPT, projectPrompt, SUMMARY_PROMPT, systemPrompt } from "./_lib/prompts";
import { estimateTokens, fitHistory, transcript } from "./_lib/context";
import { parseProject } from "./_lib/project";

export const config = { runtime: "edge" };

type Body = {
  provider?: ProviderId;
  model?: string;
  mode?: Mode;
  project?: boolean;
  search?: boolean;
  summary?: string;
  messages?: { role: string; content: unknown }[];
};

const MAX_BODY_CHARS = 400_000;

function validate(raw: Body) {
  const provider: ProviderId = raw.provider === "nvidia" ? "nvidia" : "groq";
  const mode: Mode = MODES.includes(raw.mode as Mode) ? (raw.mode as Mode) : "general";
  if (!Array.isArray(raw.messages) || raw.messages.length === 0)
    throw new UserFacingError("No messages were sent.", 400, "bad_request");
  const messages: ChatMsg[] = raw.messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""),
    }))
    .filter((m) => m.content.trim().length > 0);
  if (!messages.length || messages[messages.length - 1].role !== "user")
    throw new UserFacingError("The last message must be from the user.", 400, "bad_request");
  return {
    provider,
    model: typeof raw.model === "string" ? raw.model.slice(0, 200) : "",
    mode,
    project: Boolean(raw.project),
    search: raw.search !== false,
    summary: typeof raw.summary === "string" ? raw.summary.slice(0, 4000) : "",
    messages,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  checkEnvOnce();

  try {
    if (isForeignOrigin(req)) throw new UserFacingError("Origin not allowed.", 403, "forbidden");
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) throw new UserFacingError("Message is too large.", 413, "too_large");
    let raw: Body;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new UserFacingError("Invalid JSON body.", 400, "bad_request");
    }
    const input = validate(raw);
    if (!providerKey(input.provider))
      throw new UserFacingError(`${PROVIDERS[input.provider].label} is not configured on the server.`, 503, "provider_missing");
    await enforceRateLimit(clientIp(req));

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        let closed = false;
        const send = (event: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            closed = true;
          }
        };
        run(input, send, req.signal)
          .catch((e) => {
            const msg = e instanceof UserFacingError ? e.message : "Something went wrong while generating the reply.";
            if (!(e instanceof UserFacingError)) console.error("[mira] chat failed", e);
            send({ type: "error", message: msg, code: e instanceof UserFacingError ? e.code : "internal" });
          })
          .finally(() => {
            send({ type: "done" });
            closed = true;
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        ...corsHeaders(req),
      },
    });
  } catch (e) {
    return errorResponse(req, e);
  }
}

type Input = ReturnType<typeof validate>;
type Send = (e: Record<string, unknown>) => void;

async function run(input: Input, send: Send, signal: AbortSignal) {
  const { provider, mode, project } = input;

  // 1. Resolve the model against the live list.
  const { models, status } = await listModels(provider);
  let model = input.model;
  if (status.ok && !models.some((m) => m.id === model)) {
    const fb = await pickFallback(provider, []);
    if (!fb) throw new UserFacingError(`No chat models are available on ${PROVIDERS[provider].label} right now.`, 503, "no_models");
    if (model) send({ type: "notice", message: `"${model}" is no longer available, so Mira switched to ${fb}.` });
    model = fb;
  }
  if (!model) throw new UserFacingError("No model selected.", 400, "bad_request");
  send({ type: "meta", provider, model, mode, project });

  // 2. Token budgets. Groq's free tier counts max_tokens toward a per-minute cap.
  const ceiling = await tokenCeiling(provider, model);
  const maxTokens = project
    ? Math.min(provider === "groq" ? ceiling - 2200 : 8192, 8192)
    : Math.min(2048, Math.floor(ceiling * 0.3));
  let inputBudget = ceiling - maxTokens - 300;

  // 3. Web search on the latest user message.
  const lastUser = input.messages[input.messages.length - 1].content;
  let search: SearchResult = { sources: [] };
  if (input.search && !shouldSkipSearch(lastUser)) {
    search = await webSearch(lastUser, { deep: mode === "research", maxResults: mode === "research" ? 7 : 5 });
    if (search.error) send({ type: "notice", message: search.error });
    if (search.sources.length)
      send({ type: "sources", sources: search.sources.map(({ title, url }) => ({ title, url })) });
  }
  const searchShare = project ? 0.2 : mode === "research" ? 0.5 : 0.35;
  const searchContext = formatSearchContext(search, Math.floor(inputBudget * searchShare * 3.5));

  // 4. Fit history; fold overflow into a running summary.
  let summary = input.summary;
  const baseSystem = project ? projectPrompt(searchContext) : systemPrompt(mode, { searchContext, summary });
  inputBudget -= estimateTokens(baseSystem);
  const summaryCost = 1600;
  let { kept, dropped } = fitHistory(input.messages, inputBudget);
  if (dropped.length) {
    ({ kept, dropped } = fitHistory(input.messages, inputBudget - summaryCost));
    try {
      const text = transcript(
        summary ? [{ role: "assistant", content: `Earlier summary: ${summary}` }, ...dropped] : dropped,
        1200,
      );
      const res = await complete({
        provider,
        model,
        stream: false,
        maxTokens: 350,
        temperature: 0.2,
        reasoningEffort: "low",
        signal,
        messages: [
          { role: "system", content: SUMMARY_PROMPT },
          { role: "user", content: text },
        ],
      });
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const s = data.choices?.[0]?.message?.content?.trim();
      if (s) {
        summary = s;
        send({ type: "summary", summary, folded: dropped.length });
      }
    } catch (e) {
      if (signal.aborted) return;
      console.warn("[mira] summary failed", (e as Error).message);
      send({ type: "notice", message: "Older messages were left out to fit the model's limit." });
    }
  }

  const system = project ? projectPrompt(searchContext) : systemPrompt(mode, { searchContext, summary });
  const projectContext = project && summary ? [{ role: "user" as const, content: `Context so far: ${summary}` }] : [];
  const messages: ChatMsg[] = [{ role: "system", content: system }, ...projectContext, ...kept];

  // 5. Call the model, falling back to a second model from the same provider.
  const tried: string[] = [];
  let current = model;
  for (let attempt = 0; attempt < 2; attempt++) {
    tried.push(current);
    try {
      const outcome = project
        ? await runProject(provider, current, messages, maxTokens, send, signal)
        : await runChat(provider, current, mode, messages, maxTokens, send, signal);
      if (outcome === "ok") return;
      // Empty reply: try fallback.
      throw new UpstreamError(`${current} returned an empty response.`, 502, "empty", true);
    } catch (e) {
      if (signal.aborted) return;
      const canFallback = e instanceof UpstreamError && e.fallback && attempt === 0;
      const fb = canFallback ? await pickFallback(provider, tried) : null;
      if (!fb) throw e;
      send({ type: "notice", message: `${(e as Error).message} Retrying with ${fb}.` });
      send({ type: "meta", provider, model: fb, mode, project });
      current = fb;
    }
  }
}

async function sendUsage(send: Send, res: Response, prompt: number, completion: number) {
  const h = res.headers;
  const num = (k: string) => {
    const v = h.get(k);
    return v == null || v === "" ? undefined : Number(v);
  };
  send({
    type: "usage",
    promptTokens: prompt,
    completionTokens: completion,
    limits: {
      requestsLimit: num("x-ratelimit-limit-requests"),
      requestsRemaining: num("x-ratelimit-remaining-requests"),
      tokensLimit: num("x-ratelimit-limit-tokens"),
      tokensRemaining: num("x-ratelimit-remaining-tokens"),
    },
    search: await tavilyUsage(),
  });
}

async function runChat(
  provider: ProviderId,
  model: string,
  mode: Mode,
  messages: ChatMsg[],
  maxTokens: number,
  send: Send,
  signal: AbortSignal,
): Promise<"ok" | "empty"> {
  const res = await complete({
    provider,
    model,
    messages,
    maxTokens,
    stream: true,
    signal,
    temperature: mode === "writer" ? 0.8 : mode === "code" ? 0.3 : 0.6,
    reasoningEffort: mode === "research" || mode === "code" ? "medium" : "low",
  });
  let got = 0;
  let prompt = 0;
  let completion = 0;
  let finish = "";
  for await (const part of readCompletionStream(res)) {
    if (signal.aborted) return "ok";
    if (part.kind === "text") {
      got += part.text.length;
      send({ type: "delta", text: part.text });
    } else if (part.kind === "reasoning") send({ type: "reasoning", text: part.text });
    else if (part.kind === "usage") ({ prompt, completion } = part);
    else if (part.kind === "finish") finish = part.reason;
    else if (part.kind === "error") {
      if (!got) throw new UpstreamError(`${model} failed: ${part.message}`, 502, "stream_error", true);
      send({ type: "error", message: `The reply was cut off: ${part.message}`, code: "stream_error" });
      return "ok";
    }
  }
  if (!got) return "empty";
  if (finish === "length")
    send({ type: "notice", message: "The reply hit the length limit. Ask Mira to continue." });
  await sendUsage(send, res, prompt, completion);
  return "ok";
}

async function runProject(
  provider: ProviderId,
  model: string,
  messages: ChatMsg[],
  maxTokens: number,
  send: Send,
  signal: AbortSignal,
): Promise<"ok" | "empty"> {
  const attemptOnce = async (msgs: ChatMsg[], maxWaitSec: number) => {
    const res = await complete({
      provider,
      model,
      messages: msgs,
      maxTokens,
      stream: true,
      signal,
      temperature: 0.2,
      reasoningEffort: "low",
      maxWaitSec,
    });
    let raw = "";
    let lastCount = 0;
    let prompt = 0;
    let completion = 0;
    let finish = "";
    for await (const part of readCompletionStream(res)) {
      if (signal.aborted) break;
      if (part.kind === "text") {
        raw += part.text;
        const count = (raw.match(/"path"\s*:/g) || []).length;
        if (count !== lastCount || raw.length % 2000 < part.text.length) {
          lastCount = count;
          send({ type: "progress", files: count, chars: raw.length });
        }
      } else if (part.kind === "usage") ({ prompt, completion } = part);
      else if (part.kind === "finish") finish = part.reason;
      else if (part.kind === "error") throw new UpstreamError(`${model} failed: ${part.message}`, 502, "stream_error", !raw);
    }
    return { res, raw, prompt, completion, finish };
  };

  let r = await attemptOnce(messages, 3);
  if (signal.aborted) return "ok";
  if (!r.raw.trim()) return "empty";
  let parsed = parseProject(r.raw);

  if (!parsed.ok) {
    const why = r.finish === "length" ? "it was cut off by the length limit" : parsed.reason;
    send({ type: "notice", message: `The project output was not valid JSON (${why}). Retrying once…` });
    const fix =
      PROJECT_FIX_PROMPT +
      (r.finish === "length" ? " Keep it smaller: fewer files and shorter files so it fits." : "");
    const last = messages[messages.length - 1];
    const retryMsgs: ChatMsg[] = [...messages.slice(0, -1), { role: "user", content: `${last.content}\n\n${fix}` }];
    // On Groq the first attempt may have used this minute's token budget; wait for it.
    r = await attemptOnce(retryMsgs, provider === "groq" ? 45 : 5);
    if (signal.aborted) return "ok";
    parsed = parseProject(r.raw);
    if (!parsed.ok)
      throw new UpstreamError(
        `${model} could not produce a valid project (${parsed.reason}). Try again or pick another model.`,
        502,
        "invalid_project",
        false,
      );
  }

  const files = parsed.files;
  send({ type: "project", files });
  const list = files.map((f) => `- \`${f.path}\``).join("\n");
  send({ type: "delta", text: `Generated a project with ${files.length} file${files.length === 1 ? "" : "s"}:\n\n${list}` });
  await sendUsage(send, r.res, r.prompt, r.completion);
  return "ok";
}

