# Mira

AI chat app with multiple models from Groq and NVIDIA, automatic web search (Tavily), and multi-file project generation with live preview and ZIP download. It runs on free tiers.

## Run locally

```bash
cp .env.example .env   # fill in the keys
npm install
npm run dev            # http://localhost:8080 — serves the UI and /api/*
```

`npm run dev` runs the same `/api/*` handlers that Vercel deploys, through a Vite middleware. No separate backend process is needed.

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | server | Groq models |
| `NVIDIA_API_KEY` | server | NVIDIA build models |
| `TAVILY_API_KEY` | server | Web search on every message |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server, optional | Shared rate limits and search cache across instances |
| `RATE_LIMIT_PER_MIN`, `RATE_LIMIT_PER_DAY` | server, optional | Per-IP limits (default 12/min, 200/day) |
| `ALLOWED_ORIGINS` | server, optional | Extra origins allowed to call the API |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | Auth and chat sync. Public by design; data is protected by RLS. |

Provider keys must never use the `VITE_` prefix, because Vite ships those to the browser.

## API

- `GET /api/models` returns live chat models from both providers (cached for 10 minutes), with context sizes where available.
- `POST /api/chat` takes `{ provider, model, mode, project?, search?, summary?, messages }` and streams Server-Sent Events: `meta`, `notice`, `sources`, `summary`, `delta`, `reasoning`, `progress`, `project`, `usage`, `error`, `done`.
- `POST /api/mira` is a legacy alias of `/api/chat`.

How the server handles requests:
- **Search:** each message runs a Tavily search. Research mode uses advanced depth. Results are cached for 10 minutes.
- **Context fitting:** history is trimmed to fit the model's per-request token budget. Groq's free tier allows 8,000 tokens per minute, and `max_tokens` counts toward that. Older turns are folded into a running summary.
- **Retries:** transient failures (5xx, timeouts, short 429s) are retried with backoff. If the model is unavailable, rate-limited, or returns nothing, the server falls back to a second model from the same provider.
- **Project mode:** the model returns a JSON array of `{path, content}`. The server validates it (safe relative paths, size limits) and retries once if it's malformed. Generated code runs only in the browser, inside `<iframe sandbox="allow-scripts">`. It never runs on the server.

## Cloud history (optional)

Run `supabase/migrations/20261120000000_chat_history.sql` in the Supabase SQL editor. It creates `chats`, `messages`, `projects` and `project_files` with row-level security, and tightens the `profiles` policy. Signed-in Supabase users then sync their chats. Mock-auth users stay local-only.
