-- Run this inside your Supabase project (SQL Editor or migrations).

-- Ensure the pgcrypto extension is available for UUID generation.
create extension if not exists "pgcrypto";

-- Table for arbitrary site settings such as homepage copy and hero images.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep site settings keys unique for faster lookups.
create unique index if not exists site_settings_key_idx on public.site_settings (key);

alter table if exists public.site_settings enable row level security;

-- Table for blog posts that are editable from the admin panel.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  excerpt text,
  hero_image_url text,
  body text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure slugs are unique for routing.
create unique index if not exists blog_posts_slug_idx on public.blog_posts (slug);

alter table if exists public.blog_posts enable row level security;

create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.blog_posts
for each row
execute function public.trigger_set_timestamp();

-- If row level security is enabled globally, allow the service role to manage rows.
-- These policies assume only the service role (used by the admin panel) accesses the tables.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'Allow service role to manage site settings'
  ) then
    create policy "Allow service role to manage site settings" on public.site_settings
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'blog_posts'
      and policyname = 'Allow service role to manage blog posts'
  ) then
    create policy "Allow service role to manage blog posts" on public.blog_posts
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$ language plpgsql;
