create table if not exists public.nav_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nav_menus enable row level security;
create policy "Auth can manage menus" on public.nav_menus
  for all using (auth.role() = 'authenticated');
create policy "Anon can read menus" on public.nav_menus
  for select using (true);

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
create policy "Auth can manage nav items" on public.nav_items
  for all using (auth.role() = 'authenticated');
create policy "Anon can read nav items" on public.nav_items
  for select using (true);

create trigger nav_items_updated_at before update on public.nav_items
  for each row execute procedure public.handle_updated_at();

-- Seed Default Menus
insert into public.nav_menus (name, slug, description) values
  ('Hisako Landing - Main Navbar', 'hisako-main', 'Primary header navigation for hisako.eu landing page.'),
  ('Hisako Landing - Footer Menu', 'hisako-footer', 'Footer link columns for hisako.eu landing page.'),
  ('Documentation - Main Header', 'docs-header', 'Top header navigation bar for docs.hisako.eu.'),
  ('Documentation - Sidebar Navigation', 'docs-sidebar', 'Sidebar hierarchy and category links for docs.hisako.eu.')
on conflict (slug) do nothing;

-- Seed default nav items for hisako-main
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
