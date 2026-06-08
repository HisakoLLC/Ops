create table public.docs_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null default '',
  type text not null check (type in ('article', 'project_doc', 'product_doc')),
  is_published boolean default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  cover_image text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.docs_articles enable row level security;

-- Public can read published articles
create policy "Public read published docs" on public.docs_articles 
  for select using (is_published = true);

-- Auth users can do everything
create policy "Auth read/write docs_articles" on public.docs_articles 
  using (auth.role()='authenticated') 
  with check (auth.role()='authenticated');

create trigger docs_articles_updated_at before update on public.docs_articles
  for each row execute procedure public.handle_updated_at();

-- Create storage bucket for docs media
insert into storage.buckets (id, name, public) 
values ('docs-media', 'docs-media', true)
on conflict (id) do nothing;

-- Storage policies for docs-media bucket
create policy "Public Access" on storage.objects for select
  using (bucket_id = 'docs-media');

create policy "Auth Insert" on storage.objects for insert
  with check (auth.role()='authenticated' and bucket_id = 'docs-media');

create policy "Auth Update" on storage.objects for update
  using (auth.role()='authenticated' and bucket_id = 'docs-media');

create policy "Auth Delete" on storage.objects for delete
  using (auth.role()='authenticated' and bucket_id = 'docs-media');
