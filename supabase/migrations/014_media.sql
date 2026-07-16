create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_filename text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  alt_text text default '',
  folder text default 'general',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.media enable row level security;

create policy "Auth can read media" on public.media
  for select using (auth.role() = 'authenticated');

create policy "Auth can insert media" on public.media
  for insert with check (auth.role() = 'authenticated');

create policy "Auth can update media" on public.media
  for update using (auth.role() = 'authenticated');

create policy "Auth can delete media" on public.media
  for delete using (auth.role() = 'authenticated');

create trigger media_updated_at before update on public.media
  for each row execute procedure public.handle_updated_at();

-- Predefined folders
comment on column public.media.folder is
  'One of: general, blog, projects, products, logos, team, og-images';
