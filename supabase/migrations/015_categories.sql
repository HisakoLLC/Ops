create table if not exists public.doc_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  parent_id uuid references public.doc_categories(id) on delete set null,
  cover_image_url text default '',
  sort_order integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.doc_categories enable row level security;
create policy "Auth can manage categories" on public.doc_categories
  for all using (auth.role() = 'authenticated');
create policy "Anon can read categories" on public.doc_categories
  for select using (true);

create trigger doc_categories_updated_at before update on public.doc_categories
  for each row execute procedure public.handle_updated_at();

alter table public.docs
  add column if not exists category_id uuid references public.doc_categories(id) on delete set null;

create table if not exists public.doc_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

alter table public.doc_tags enable row level security;
create policy "Auth can manage tags" on public.doc_tags
  for all using (auth.role() = 'authenticated');
create policy "Anon can read tags" on public.doc_tags
  for select using (true);

-- Seed defaults
insert into public.doc_categories (name, slug, description, sort_order) values
  ('AI Automation', 'ai-automation', 'Guides and strategies for automating workflows with AI.', 1),
  ('Case Studies', 'case-studies', 'Real-world implementations and client outcomes.', 2),
  ('Technical Guides', 'technical-guides', 'In-depth engineering and integration tutorials.', 3),
  ('Industry Insights', 'industry-insights', 'Trends and analysis across healthcare, retail, and more.', 4),
  ('Product Updates', 'product-updates', 'New features and changelogs for Hisako tools.', 5)
on conflict (slug) do nothing;

-- Function and trigger to auto-sync tags
create or replace function public.sync_doc_tags()
returns trigger as $$
declare
  tag_item text;
  tag_slug text;
begin
  if new.tags is not null then
    foreach tag_item in array new.tags loop
      tag_slug := lower(regexp_replace(tag_item, '[^a-z0-9]+', '-', 'g'));
      tag_slug := trim(both '-' from tag_slug);
      if tag_slug != '' then
        insert into public.doc_tags (name, slug)
        values (tag_item, tag_slug)
        on conflict (name) do nothing;
      end if;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists sync_tags_on_doc_save on public.docs;
create trigger sync_tags_on_doc_save
  after insert or update of tags on public.docs
  for each row execute procedure public.sync_doc_tags();
