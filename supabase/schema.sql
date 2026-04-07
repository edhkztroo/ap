create extension if not exists pgcrypto;

create table if not exists public.survey_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  summary text not null,
  content text not null,
  content_blocks jsonb not null default '[]'::jsonb,
  image_url text not null,
  pdf_url text not null,
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

alter table public.survey_posts
add column if not exists content_blocks jsonb not null default '[]'::jsonb;

alter table public.survey_posts enable row level security;

drop policy if exists "Public can read survey posts" on public.survey_posts;
create policy "Public can read survey posts"
on public.survey_posts
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert survey posts" on public.survey_posts;
create policy "Authenticated users can insert survey posts"
on public.survey_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update survey posts" on public.survey_posts;
create policy "Authenticated users can update survey posts"
on public.survey_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('survey-images', 'survey-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read survey images" on storage.objects;
create policy "Public can read survey images"
on storage.objects
for select
to public
using (bucket_id = 'survey-images');

drop policy if exists "Authenticated users can upload survey images" on storage.objects;
create policy "Authenticated users can upload survey images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'survey-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
