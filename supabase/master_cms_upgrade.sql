-- ==============================================================================
-- HISAKO CMS MASTER UPGRADE SQL SCRIPT
-- Consolidated migrations for Prompts A through F
-- Run this single script in your Supabase SQL Editor to apply all schema upgrades.
-- ==============================================================================

-- Ensure 'review' status is present in enum right from the start
alter type public.doc_status add value if not exists 'review';

-- ------------------------------------------------------------------------------
-- 1. PROMPT A: MEDIA LIBRARY (`public.media`)
-- ------------------------------------------------------------------------------
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

drop policy if exists "Auth can read media" on public.media;
create policy "Auth can read media" on public.media
  for select using (auth.role() = 'authenticated');

drop policy if exists "Auth can insert media" on public.media;
create policy "Auth can insert media" on public.media
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Auth can update media" on public.media;
create policy "Auth can update media" on public.media
  for update using (auth.role() = 'authenticated');

drop policy if exists "Auth can delete media" on public.media;
create policy "Auth can delete media" on public.media
  for delete using (auth.role() = 'authenticated');

drop trigger if exists media_updated_at on public.media;
create trigger media_updated_at before update on public.media
  for each row execute procedure public.handle_updated_at();

comment on column public.media.folder is
  'One of: general, blog, projects, products, logos, team, og-images';


-- ------------------------------------------------------------------------------
-- 2. PROMPT B: CATEGORIES & TAG MANAGER (`public.doc_categories`, `public.doc_tags`)
-- ------------------------------------------------------------------------------
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

drop policy if exists "Auth can manage categories" on public.doc_categories;
create policy "Auth can manage categories" on public.doc_categories
  for all using (auth.role() = 'authenticated');

drop policy if exists "Anon can read categories" on public.doc_categories;
create policy "Anon can read categories" on public.doc_categories
  for select using (true);

drop trigger if exists doc_categories_updated_at on public.doc_categories;
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

drop policy if exists "Auth can manage tags" on public.doc_tags;
create policy "Auth can manage tags" on public.doc_tags
  for all using (auth.role() = 'authenticated');

drop policy if exists "Anon can read tags" on public.doc_tags;
create policy "Anon can read tags" on public.doc_tags
  for select using (true);

-- Seed category defaults
insert into public.doc_categories (name, slug, description, sort_order) values
  ('AI Automation', 'ai-automation', 'Guides and strategies for automating workflows with AI.', 1),
  ('Case Studies', 'case-studies', 'Real-world implementations and client outcomes.', 2),
  ('Technical Guides', 'technical-guides', 'In-depth engineering and integration tutorials.', 3),
  ('Industry Insights', 'industry-insights', 'Trends and analysis across healthcare, retail, and more.', 4),
  ('Product Updates', 'product-updates', 'New features and changelogs for Hisako tools.', 5)
on conflict (slug) do nothing;

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


-- ------------------------------------------------------------------------------
-- 3. PROMPT C: ROLES AND PERMISSIONS (`public.profiles.role` & RLS policies)
-- ------------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'editor', 'writer', 'member', 'viewer'));

create or replace function public.get_user_role(p_user_id uuid)
returns text as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = p_user_id;
  return coalesce(v_role, 'viewer');
end;
$$ language plpgsql security definer;

create or replace function public.has_permission(p_user_id uuid, p_action text)
returns boolean as $$
declare
  v_role text;
begin
  v_role := public.get_user_role(p_user_id);
  if v_role = 'admin' then return true; end if;
  if p_action = 'publish_doc' then return v_role in ('editor'); end if;
  if p_action = 'delete_doc' then return v_role in ('editor'); end if;
  if p_action = 'create_doc' then return v_role in ('editor', 'writer', 'member'); end if;
  if p_action = 'edit_any_doc' then return v_role in ('editor'); end if;
  if p_action = 'manage_categories' then return v_role in ('editor'); end if;
  if p_action = 'manage_navigation' then return v_role in ('editor'); end if;
  if p_action = 'manage_forms' then return v_role in ('editor'); end if;
  if p_action = 'manage_media' then return v_role in ('editor', 'writer'); end if;
  return false;
end;
$$ language plpgsql security definer;

-- Add 'review' to doc_status enum if not already present
alter type public.doc_status add value if not exists 'review';

alter table public.docs enable row level security;

drop policy if exists "Docs select policy" on public.docs;
create policy "Docs select policy" on public.docs
  for select using (
    status::text = 'published'
    or auth.role() = 'authenticated'
  );

drop policy if exists "Docs insert policy" on public.docs;
create policy "Docs insert policy" on public.docs
  for insert with check (
    public.has_permission(auth.uid(), 'create_doc')
  );

drop policy if exists "Docs update policy" on public.docs;
create policy "Docs update policy" on public.docs
  for update using (
    public.has_permission(auth.uid(), 'edit_any_doc')
    or (
      author_id = auth.uid()
      and status::text in ('draft', 'review')
    )
  );

drop policy if exists "Docs delete policy" on public.docs;
create policy "Docs delete policy" on public.docs
  for delete using (
    public.has_permission(auth.uid(), 'delete_doc')
    or (
      author_id = auth.uid()
      and status::text = 'draft'
    )
  );


-- ------------------------------------------------------------------------------
-- 4. PROMPT D: NAVIGATION MENUS & ITEMS (`public.nav_menus`, `public.nav_items`)
-- ------------------------------------------------------------------------------
create table if not exists public.nav_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nav_menus enable row level security;

drop policy if exists "Auth can manage menus" on public.nav_menus;
create policy "Auth can manage menus" on public.nav_menus
  for all using (auth.role() = 'authenticated');

drop policy if exists "Anon can read menus" on public.nav_menus;
create policy "Anon can read menus" on public.nav_menus
  for select using (true);

drop trigger if exists nav_menus_updated_at on public.nav_menus;
create trigger nav_menus_updated_at before update on public.nav_menus
  for each row execute procedure public.handle_updated_at();

create table if not exists public.nav_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.nav_menus(id) on delete cascade,
  parent_id uuid references public.nav_items(id) on delete cascade,
  label text not null,
  href text not null default '#',
  target text not null default '_self',
  icon_name text default '',
  is_button boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nav_items enable row level security;

drop policy if exists "Auth can manage nav items" on public.nav_items;
create policy "Auth can manage nav items" on public.nav_items
  for all using (auth.role() = 'authenticated');

drop policy if exists "Anon can read nav items" on public.nav_items;
create policy "Anon can read nav items" on public.nav_items
  for select using (true);

drop trigger if exists nav_items_updated_at on public.nav_items;
create trigger nav_items_updated_at before update on public.nav_items
  for each row execute procedure public.handle_updated_at();

insert into public.nav_menus (name, slug, description) values
  ('Hisako Landing - Main Navbar', 'hisako-main', 'Primary header navigation for hisako.eu landing page.'),
  ('Hisako Landing - Footer Menu', 'hisako-footer', 'Footer link columns for hisako.eu landing page.'),
  ('Documentation - Main Header', 'docs-header', 'Top header navigation bar for docs.hisako.eu.'),
  ('Documentation - Sidebar Navigation', 'docs-sidebar', 'Sidebar hierarchy and category links for docs.hisako.eu.')
on conflict (slug) do nothing;

do $$
declare
  v_menu_id uuid;
begin
  select id into v_menu_id from public.nav_menus where slug = 'hisako-main';
  if v_menu_id is not null then
    insert into public.nav_items (menu_id, label, href, sort_order, is_button) values
      (v_menu_id, 'Solutions', '/#solutions', 1, false),
      (v_menu_id, 'Case Studies', '/#case-studies', 2, false),
      (v_menu_id, 'Pricing', '/#pricing', 3, false),
      (v_menu_id, 'Documentation', 'https://docs.hisako.eu', 4, false),
      (v_menu_id, 'Get Started', '/contact', 5, true)
    on conflict do nothing;
  end if;

  select id into v_menu_id from public.nav_menus where slug = 'docs-header';
  if v_menu_id is not null then
    insert into public.nav_items (menu_id, label, href, sort_order, target) values
      (v_menu_id, 'All Articles', '/articles', 1, '_self'),
      (v_menu_id, 'Projects', '/projects', 2, '_self'),
      (v_menu_id, 'Product Docs', '/products', 3, '_self'),
      (v_menu_id, 'Hisako.eu', 'https://hisako.eu', 4, '_blank')
    on conflict do nothing;
  end if;
end;
$$;


-- ------------------------------------------------------------------------------
-- 5. PROMPT E: FORMS MANAGEMENT (`public.form_submissions`)
-- ------------------------------------------------------------------------------
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null default 'general',
  name text,
  email text not null,
  company text,
  phone text,
  message text,
  metadata jsonb default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'in_progress', 'replied', 'spam', 'archived')),
  notes text default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  ip_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.form_submissions enable row level security;

drop policy if exists "Auth can manage form_submissions" on public.form_submissions;
create policy "Auth can manage form_submissions" on public.form_submissions
  for all using (auth.role() = 'authenticated');

drop policy if exists "Anyone can submit form" on public.form_submissions;
create policy "Anyone can submit form" on public.form_submissions
  for insert with check (true);

drop trigger if exists form_submissions_updated_at on public.form_submissions;
create trigger form_submissions_updated_at before update on public.form_submissions
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_form_submissions_status on public.form_submissions(status);
create index if not exists idx_form_submissions_form_type on public.form_submissions(form_type);
create index if not exists idx_form_submissions_created_at on public.form_submissions(created_at desc);


-- ------------------------------------------------------------------------------
-- 6. PROMPT F: REVISION HISTORY (`public.doc_revisions`)
-- ------------------------------------------------------------------------------
create table if not exists public.doc_revisions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.docs(id) on delete cascade,
  title text not null,
  content text not null,
  excerpt text,
  slug text,
  status text,
  category_id uuid references public.doc_categories(id) on delete set null,
  tags text[],
  author_id uuid references public.profiles(id) on delete set null,
  revision_notes text default '',
  created_at timestamptz default now()
);

alter table public.doc_revisions enable row level security;

drop policy if exists "Auth can read and manage doc revisions" on public.doc_revisions;
create policy "Auth can read and manage doc revisions" on public.doc_revisions
  for all using (auth.role() = 'authenticated');

create index if not exists idx_doc_revisions_doc_id on public.doc_revisions(doc_id);
create index if not exists idx_doc_revisions_created_at on public.doc_revisions(created_at desc);

create or replace function public.snapshot_doc_before_update()
returns trigger as $$
begin
  if (OLD.title is distinct from NEW.title) or 
     (OLD.content is distinct from NEW.content) or 
     (OLD.status is distinct from NEW.status) or
     (OLD.category_id is distinct from NEW.category_id) then
    insert into public.doc_revisions (
      doc_id, title, content, excerpt, slug, status, category_id, tags, author_id, revision_notes, created_at
    ) values (
      OLD.id, OLD.title, OLD.content, OLD.excerpt, OLD.slug, OLD.status, OLD.category_id, OLD.tags, OLD.author_id, 
      coalesce(NEW.title || ' updated', 'Auto-saved revision'), now()
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists create_doc_revision_on_update on public.docs;
create trigger create_doc_revision_on_update
  before update on public.docs
  for each row execute procedure public.snapshot_doc_before_update();
