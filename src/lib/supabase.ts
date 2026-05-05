import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * SQL SCHEMA FOR MIRA // SUPABASE INITIALIZATION
 * --------------------------------------------------
 * Run this in your Supabase SQL Editor (found in your Dashboard):
 * 
 * -- 1. Create a profiles table to track user data
 * create table profiles (
 *   id uuid references auth.users on delete cascade not null primary key,
 *   updated_at timestamp with time zone default now(),
 *   full_name text,
 *   avatar_url text,
 *   tokens_used bigint default 0,
 *   
 *   constraint full_name_length check (char_length(full_name) >= 3)
 * );
 * 
 * -- 2. Set up Row Level Security (RLS)
 * alter table profiles enable row level security;
 * 
 * create policy "Public profiles are viewable by everyone." on profiles
 *   for select using (true);
 * 
 * create policy "Users can update their own profile." on profiles
 *   for update using (auth.uid() = id);
 * 
 * -- 3. Create a trigger to automatically create a profile on signup
 * create function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, full_name, avatar_url)
 *   values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 * 
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */
