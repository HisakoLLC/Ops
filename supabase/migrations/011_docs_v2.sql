-- Drop old docs_articles table and related objects
drop trigger if exists docs_articles_updated_at on public.docs_articles;
drop table if exists public.docs_articles cascade;

-- Content types enum
create type public.doc_content_type as enum ('article', 'project', 'product_doc');
create type public.doc_status as enum ('draft', 'published', 'archived');

-- Products (for product documentation grouping)
create table public.doc_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  version text default '1.0',
  sort_order integer default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.doc_products enable row level security;
create policy "Public can read products" on public.doc_products
  for select using (true);
create policy "Auth can write products" on public.doc_products
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Doc categories / sections (for sidebar navigation)
create table public.doc_sections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.doc_products(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique(product_id, slug)
);
alter table public.doc_sections enable row level security;
create policy "Public can read sections" on public.doc_sections
  for select using (true);
create policy "Auth can write sections" on public.doc_sections
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Main docs table
create table public.docs (
  id uuid primary key default gen_random_uuid(),
  content_type doc_content_type not null,
  status doc_status not null default 'draft',

  -- Core fields (all types)
  title text not null,
  slug text not null,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  tags text[] default '{}',
  reading_time_minutes integer,

  -- Author
  author_id uuid references public.profiles(id),
  author_name_override text, -- if not a team member

  -- Dates
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),

  -- Article-specific
  featured boolean default false,

  -- Project case study-specific
  project_industry text,
  project_tools text[], -- ['n8n', 'Claude', 'Make', etc.]
  project_outcome text,
  project_client_name text, -- null = anonymised
  project_anonymous boolean default true,

  -- Product doc-specific
  product_id uuid references public.doc_products(id) on delete set null,
  section_id uuid references public.doc_sections(id) on delete set null,
  sort_order integer default 0,

  -- SEO
  seo_title text,
  seo_description text,

  -- Slug must be unique per content type
  unique(content_type, slug)
);
alter table public.docs enable row level security;

-- Public can read published docs
create policy "Public can read published docs" on public.docs
  for select using (status = 'published');

-- Auth can read all docs (including drafts)
create policy "Auth can read all docs" on public.docs
  for select using (auth.role() = 'authenticated');

-- Auth can write docs
create policy "Auth can write docs" on public.docs
  for insert with check (auth.role() = 'authenticated');
create policy "Auth can update docs" on public.docs
  for update using (auth.role() = 'authenticated');
create policy "Auth can delete docs" on public.docs
  for delete using (auth.role() = 'authenticated');

-- Full text search vector
alter table public.docs add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(excerpt, '') || ' ' ||
      coalesce(content, '')
    )
  ) stored;
create index docs_search_idx on public.docs using gin(search_vector);

-- Comments
create table public.doc_comments (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid references public.docs(id) on delete cascade not null,
  parent_id uuid references public.doc_comments(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  content text not null,
  approved boolean default false, -- moderated before showing
  created_at timestamptz default now()
);
alter table public.doc_comments enable row level security;

-- Public can read approved comments
create policy "Public can read approved comments" on public.doc_comments
  for select using (approved = true);

-- Public can insert comments (moderated)
create policy "Public can submit comments" on public.doc_comments
  for insert with check (true);

-- Auth can manage all comments
create policy "Auth can manage comments" on public.doc_comments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-update updated_at
create trigger docs_updated_at before update on public.docs
  for each row execute procedure public.handle_updated_at();
create trigger doc_products_updated_at before update on public.doc_products
  for each row execute procedure public.handle_updated_at();

-- Auto-calculate reading time on insert/update
create or replace function public.calculate_reading_time()
returns trigger as $$
begin
  -- Average reading speed: 200 words per minute
  new.reading_time_minutes := greatest(1,
    round(array_length(regexp_split_to_array(trim(new.content), '\s+'), 1) / 200.0)
  );
  return new;
end;
$$ language plpgsql;
create trigger docs_reading_time before insert or update of content on public.docs
  for each row execute procedure public.calculate_reading_time();

-- Seed default products
insert into public.doc_products (name, slug, description, version) values
  ('VendoFlow', 'vendoflow', 'Retail POS and business management platform', '1.0'),
  ('Passr', 'passr', 'EU Digital Product Passport compliance platform', '1.0');
