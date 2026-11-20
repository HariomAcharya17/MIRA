-- Mira: chat history and generated projects.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Every table is protected by Row Level Security: users only see their own rows.

-- "users" are Supabase auth.users; public profile data lives in profiles.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  updated_at timestamptz default now(),
  full_name text,
  avatar_url text,
  tokens_used bigint default 0
);
alter table public.profiles enable row level security;
-- Replaces the old "viewable by everyone" policy.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create table if not exists public.chats (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text not null default 'New chat',
  model text,
  provider text,
  mode text,
  summary text,
  summarized_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);

create table if not exists public.messages (
  id text primary key,
  chat_id text not null references public.chats on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  model text,
  provider text,
  sources jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, position);

create table if not exists public.projects (
  id text primary key,                       -- = id of the assistant message that produced it
  chat_id text references public.chats on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null default 'mira-project',
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  project_id text not null references public.projects on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  path text not null,
  content text not null,
  primary key (project_id, path)
);

do $$
declare t text;
begin
  foreach t in array array['chats', 'messages', 'projects', 'project_files'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_own', t
    );
  end loop;
end $$;
