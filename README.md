# 🧠 MIRA — AI Studio

<p align="center">
  <img src="https://img.shields.io/badge/MIRA-AI%20Studio-blueviolet?style=for-the-badge&logo=sparkles&logoColor=white" alt="MIRA AI Studio" />
</p>

<h1 align="center">🧠 MIRA — AI Studio</h1>

<p align="center">
  <strong>One AI to access every model.</strong><br/>
  A personalized, superfast AI workspace that unifies multiple LLMs into a single beautiful interface.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-API-FF6B35?style=flat-square" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel&logoColor=white" />
</p>

---

## ✨ What is MIRA?

**MIRA** (Neural Interface for Advanced AI) is a full‑stack AI chat studio built by **Hariom Acharya**. It lets you switch between multiple state‑of‑the‑art LLMs mid‑conversation — without losing context — all through a sleek, futuristic interface.

> Think of it as your personal AI command center: one interface, every model, zero friction.

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| 🔀 **Multi‑Model Switching** | Switch between 5+ models (DeepSeek R1, Llama 3.3 70B, Llama 3.1 8B, Llama 3.2 Vision, Llama 3.2 3B) mid‑conversation |
| 🌐 **Smart Web Search** | Automatic Tavily‑powered web search — the AI decides when to search based on query analysis |
| 🖼️ **Vision Support** | Send images to the Llama Vision model for multimodal understanding |
| 🔐 **Dual Auth System** | Supabase auth for production + seamless localStorage mock auth for offline/demo use |
| 📊 **Live Telemetry** | Real‑time token usage tracking, model‑level analytics, and system load visualization |
| 💾 **Session Persistence** | All chat sessions saved locally per user — browse, search, and replay history |
| 📥 **Export & Downloads** | Export conversations as text files; persistent download repository |
| 🌗 **Dark/Light Themes** | Full theme support with smooth transitions |
| 📱 **Responsive Design** | Desktop sidebar collapses to mobile sheet; fully touch‑friendly |
| ⚡ **Streaming Responses** | Real‑time SSE streaming from Groq for instant token‑by‑token output |
| 🛡️ **Privacy First** | All session data stored locally — zero remote retention |
| 🚀 **Vercel Edge Runtime** | Serverless API deployed on Vercel Edge for ultra‑low latency |

---

## 🏗️ Architecture

```
mira-ai-studio/
├── api/
│   └── mira.ts                # Vercel Edge serverless function (production API)
├── src/
│   ├── components/
│   │   ├── landing/            # Hero, Features, Contact, FAQ, About, Blog
│   │   ├── layout/             # Header, Footer, Layout wrapper
│   │   ├── ui/                 # shadcn/ui component library
│   │   ├── GlowOrbs.tsx        # Ambient glow effects
│   │   ├── NavLink.tsx         # Navigation link component
│   │   └── TrafficLights.tsx   # macOS‑style window chrome
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Auth provider (Supabase + Mock fallback)
│   │   └── ThemeContext.tsx     # Dark/light theme provider
│   ├── hooks/
│   │   ├── use-mobile.tsx      # Responsive breakpoint hook
│   │   └── use-toast.ts       # Toast notification hook
│   ├── lib/
│   │   ├── mira-api.ts        # Model definitions & types
│   │   ├── store.ts           # localStorage state management (sessions, downloads, usage)
│   │   ├── supabase.ts        # Supabase client initialization
│   │   └── utils.ts           # Utility helpers (cn)
│   ├── pages/
│   │   ├── AI.tsx              # Main chat workspace (779 lines)
│   │   ├── Index.tsx           # Landing page
│   │   ├── Login.tsx           # Login page
│   │   ├── Signup.tsx          # Signup page
│   │   ├── ForgotPassword.tsx  # Password reset
│   │   ├── Account.tsx         # User profile & stats
│   │   ├── History.tsx         # Chat session archive
│   │   ├── Downloads.tsx       # Export repository
│   │   └── NotFound.tsx        # 404 page
│   └── App.tsx                 # Router & providers
├── server.js                     # Express dev server (local development)
├── vercel.json                   # Vercel deployment config
├── tailwind.config.ts            # Custom MIRA color palette
└── package.json
```

---

## 🤖 Supported Models

All models are served through **Groq's API** (free tier — no credit card needed).

| Model | ID | Category | Context | Badge |
|---|---|---|---|---|
| DeepSeek R1 (Reasoning) | `deepseek-r1-distill-llama-70b` | Reasoning | 128K | `REASONING` |
| MIRA ULTRA (Llama 3.3) | `llama-3.3-70b-versatile` | Reasoning | 128K | `ULTRA` |
| Llama 3.1 8B | `llama-3.1-8b-instant` | General | 128K | `INSTANT` |
| Llama 3.2 11B Vision | `llama-3.2-11b-vision-preview` | Vision | 128K | `VISION` |
| Llama 3.2 3B | `llama-3.2-3b-preview` | General | 128K | `FREE` |

The system includes **automatic fallback**: if the selected model fails, it falls back to Llama 3.3 70B.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **pnpm**
- A free **Groq API key** → https://console.groq.com
- *(Optional)* **Tavily API key** for web search → https://tavily.com
- *(Optional)* **Supabase project** for production auth → https://supabase.com

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mira-ai-studio.git
cd mira-ai-studio

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
GROQ_API_KEY=your_groq_api_key

# Optional — enables smart web search
TAVILY_API_KEY=your_tavily_api_key

# Optional — enables Supabase auth (falls back to mock auth if not set)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

```bash
# Run both frontend + backend concurrently
npm run dev:all

# Or run them separately:
npm run dev          # Frontend only (Vite — port 8080)
npm run dev:server   # Backend only (Express — port 3001)
```

The app will be available at **http://localhost:8080**

### Default Login (Mock Auth)

When Supabase is not configured, the app automatically uses local mock auth:

| Email | Password |
|---|---|
| `admin@mira.io` | `password` |

You can also sign up with any email — accounts are stored in your browser's localStorage.

---

## 🌐 Deployment (Vercel)

MIRA is configured for one‑click deployment on **Vercel**:

1. Push to GitHub
2. Import the repo in https://vercel.com
3. Set environment variables (`GROQ_API_KEY`, `TAVILY_API_KEY`, etc.)
4. Deploy — the `api/mira.ts` edge function handles all API calls

The `vercel.json` is pre‑configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🔍 How Smart Search Works

MIRA's web search is fully automatic — no manual toggle needed:

1. **Query Analysis** — A lightweight Llama 3.3 70B call classifies the user's message.
2. **Decision** — Searches for real people, current events, organisations, sports, stocks, etc. Skips: code tasks, math, greetings.
3. **Web Fetch** — Tavily API retrieves up to 10 advanced results with an AI‑generated summary.
4. **Injection** — Live data is injected into the system prompt, overriding stale training data.
5. **Response** — MIRA answers using the freshest available information.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | React Context, localStorage, TanStack Query |
| **Auth** | Supabase Auth (production) / Mock Auth (offline) |
| **AI Backend** | Groq API (Llama, DeepSeek models) |
| **Web Search** | Tavily API |
| **Deployment** | Vercel (Edge Runtime) |
| **UI Components** | Radix UI primitives, Lucide icons |
| **Markdown** | react‑markdown for rich AI responses |
| **Analytics** | Vercel Analytics |

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run dev:server` | Start Express backend server |
| `npm run dev:all` | Run frontend + backend concurrently |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

---

## 🗃️ Supabase Setup (Optional)

If you want production‑grade auth with Supabase, run this SQL in your Supabase SQL editor:

```sql
-- 1. Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  tokens_used bigint default 0,
  constraint full_name_length check (char_length(full_name) >= 3)
);

-- 2. Enable RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- 3. Auto‑create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 🎨 Design Philosophy

MIRA embraces a **futuristic neural‑interface aesthetic**:

- **Glassmorphism** panels with backdrop blur
- **macOS‑style traffic‑light window chrome** on all cards
- **Interactive glow letters** — hover to see a cascade of purple light across the title
- **Gradient telemetry bars** with real‑time progress visualization
- **Framer Motion** animations for smooth page transitions
- **Custom MIRA colour palette** — purple, cyan, pink, blue gradients
- **JetBrains Mono** for code/system text, **Inter** for UI text

---

## 📄 License

This project is open source. Built with ❤️ by **Hariom Acharya**.

---

<p align="center">
  <strong>MIRA</strong> — Neural Interface for Advanced AI<br/>
  <sub>Switch models · Preserve context · Think deeper</sub>
</p>
