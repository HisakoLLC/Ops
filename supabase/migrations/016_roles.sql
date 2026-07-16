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

-- RLS policies on docs using the new functions
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
