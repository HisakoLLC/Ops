create table public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default 'BookOpen',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.kb_categories(id) on delete set null,
  title text not null,
  slug text unique not null,
  content text not null default '',
  tags text[] default '{}',
  pinned boolean default false,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;
create policy "Auth read/write kb_categories" on public.kb_categories using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Auth read/write kb_articles" on public.kb_articles using (auth.role()='authenticated') with check (auth.role()='authenticated');
create trigger kb_articles_updated_at before update on public.kb_articles
  for each row execute procedure public.handle_updated_at();

-- Seed default categories
insert into public.kb_categories (name, icon, sort_order) values
  ('Pipeline SOPs', 'GitBranch', 1),
  ('Client Process', 'Users', 2),
  ('Document Guides', 'FileText', 3),
  ('Team Guides', 'UserCheck', 4),
  ('Technical Reference', 'Code2', 5);
