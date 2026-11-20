# Mira

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.8" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3.4" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

Mira is a chat app for open models from Groq and NVIDIA. It adds web search with cited sources and can generate multi-file projects that you preview in the browser and download as a ZIP. It runs on free API tiers.

Built by **Hariom Acharya**.

## Features

| Feature | Details |
|---|---|
| Multiple models | Live model list from Groq and NVIDIA. Switch models mid-conversation and keep the context. |
| Web search | Each message can run a Tavily search first. Sources are listed under the reply. |
| Modes | General, Code, Research (deeper search with inline citations) and Writer. |
| Project generation | Describe a small app and get a set of files. HTML projects preview in a sandboxed iframe, and everything downloads as a ZIP. |
| Long conversations | History is trimmed to fit each model's token budget. Older turns are folded into a running summary. |
| Fallbacks | Transient errors are retried. If a model is busy or unavailable, the request falls back to another model from the same provider. |
| Rendering | Markdown, tables and syntax-highlighted code with copy buttons. |
| Accounts | Supabase auth, or a local demo mode when Supabase isn't configured. |
| Chat history | Saved in the browser, and synced to Supabase for signed-in users. |
| Themes | Light and dark. |

## Project structure

```
mira-ai-studio/
├── api/                      # Vercel serverless functions
│   ├── chat.ts               # POST /api/chat — streams replies (SSE)
│   ├── models.ts             # GET /api/models — live model list
│   ├── mira.ts               # Legacy alias of /api/chat
│   └── _lib/                 # Providers, search, prompts, context fitting, rate limits
├── src/
│   ├── components/
│   │   ├── chat/             # Sidebar, composer, messages, markdown, model picker, project panel
│   │   ├── landing/          # Hero, Features, Contact
│   │   ├── layout/           # Header, Footer, Layout
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # Auth (Supabase + demo fallback), theme
│   ├── lib/                  # API client, local store, Supabase sync, project helpers
│   └── pages/                # AI chat, landing, auth, account, history, downloads
├── supabase/migrations/      # Database schema for chat history
├── vite.config.ts            # Also serves /api/* in local dev
└── vercel.json
```

## Getting started

Requirements: Node.js 18+ and at least one model provider key.

```bash
git clone https://github.com/HariomAcharya17/MIRA.git
cd MIRA
npm install
cp .env.example .env   # then fill in your keys
npm run dev            # http://localhost:8080
```

`npm run dev` serves the UI and runs the same `/api/*` handlers that Vercel deploys. No separate backend process is needed.

### Environment variables

| Name | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | server | Groq models ([get a key](https://console.groq.com/keys)) |
| `NVIDIA_API_KEY` | server | NVIDIA models ([get a key](https://build.nvidia.com)) |
| `TAVILY_API_KEY` | server | Web search ([get a key](https://app.tavily.com)) |
| `RATE_LIMIT_PER_MIN`, `RATE_LIMIT_PER_DAY` | server, optional | Per-IP limits (default 12/min, 200/day) |
| `ALLOWED_ORIGINS` | server, optional | Extra origins allowed to call the API |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client, optional | Auth and chat sync. Public by design; data is protected by row-level security. |

Never prefix provider keys with `VITE_`. Vite ships those variables to the browser.

Rate limits and the search cache are kept in memory, so on Vercel they apply per server instance.

### Demo login

Without Supabase settings, the app uses a local demo mode:

| Email | Password |
|---|---|
| `admin@mira.io` | `password` |

You can also sign up with any email. Demo accounts are stored in the browser's localStorage.

## Deployment (Vercel)

1. Import the repository in Vercel.
2. Add the environment variables above under **Settings → Environment Variables**.
3. Deploy. Files in `api/` become serverless functions, and `vercel.json` rewrites all other routes to the app.

## Supabase setup (optional)

Run `supabase/migrations/20261120000000_chat_history.sql` in the Supabase SQL editor (or `supabase db push`). It creates the `profiles`, `chats`, `messages`, `projects` and `project_files` tables with row-level security, so users can read only their own data. Signed-in users then sync their chats. Demo-mode users stay local only.

## API

- `GET /api/models` returns the chat models from both providers, cached for 10 minutes, with context sizes where available.
- `POST /api/chat` takes `{ provider, model, mode, project?, search?, summary?, messages }` and streams Server-Sent Events: `meta`, `notice`, `sources`, `summary`, `delta`, `reasoning`, `progress`, `project`, `usage`, `error`, `done`.

In project mode the model returns a JSON array of `{ path, content }`. The server checks it (safe relative paths, size limits) and retries once if it's malformed. Generated code runs only in the browser, inside `<iframe sandbox="allow-scripts">`. It never runs on the server.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui (Radix), Lucide icons |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Models | Groq API, NVIDIA API |
| Search | Tavily API |
| Auth and data | Supabase |
| Hosting | Vercel (serverless functions, Analytics) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with UI and API on port 8080 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run test` | Tests (Vitest) |

## License

Open source. © Hariom Acharya.
