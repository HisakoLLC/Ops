-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Settings (single row)
create table public.settings (
  id integer primary key default 1 check (id = 1),
  company_legal_name text default 'Hisako Technologies Limited',
  trading_name text default 'Hisako',
  email text default 'hello@hisako.eu',
  website text default 'hisako.eu',
  registered_country text default 'Kenya',
  currency text default 'USD',
  deposit_percentage integer default 50,
  payment_terms_days integer default 7,
  late_payment_interest numeric(4,2) default 2.00,
  retainer_notice_days integer default 30,
  calendly_url text,
  whatsapp_number text,
  updated_at timestamptz default now()
);
alter table public.settings enable row level security;
create policy "Authenticated users can read settings" on public.settings for select using (auth.role() = 'authenticated');
create policy "Admins can update settings" on public.settings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
insert into public.settings (id) values (1);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id),
  ref text unique,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  industry text,
  company_size text,
  country text,
  pipeline_stage text not null default 'lead'
    check (pipeline_stage in ('lead','discovery','proposal','signed','build','live','retainer','inactive','churned')),
  pipeline_value numeric(10,2),
  retainer_amount numeric(10,2),
  retainer_active boolean default false,
  source text,
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.clients enable row level security;
create policy "Authenticated users can CRUD clients" on public.clients
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-generate client ref
create or replace function public.generate_client_ref()
returns trigger as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq integer;
begin
  select count(*) + 1 into seq from public.clients
    where extract(year from created_at) = extract(year from now());
  new.ref := 'HSK-' || year_str || '-' || lpad(seq::text, 3, '0');
  return new;
end;
$$ language plpgsql;
create trigger set_client_ref
  before insert on public.clients
  for each row execute procedure public.generate_client_ref();

-- Activities
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  created_by uuid references public.profiles(id),
  type text not null check (type in (
    'note','call','email','meeting','stage_change',
    'document_generated','payment_received'
  )),
  title text not null,
  body text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.activities enable row level security;
create policy "Authenticated users can CRUD activities" on public.activities
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  created_by uuid references public.profiles(id),
  doc_type text not null check (doc_type in (
    'discovery_script','intake_questionnaire','proposal',
    'services_agreement','nda','onboarding_checklist',
    'pipeline_handover','monthly_report'
  )),
  doc_label text not null,
  form_data jsonb not null default '{}',
  storage_path text,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.documents enable row level security;
create policy "Authenticated users can CRUD documents" on public.documents
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Team invites
create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid references public.profiles(id),
  role text default 'member',
  accepted boolean default false,
  created_at timestamptz default now()
);
alter table public.team_invites enable row level security;
create policy "Admins can manage invites" on public.team_invites
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Updated_at trigger for clients and documents
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger clients_updated_at before update on public.clients
  for each row execute procedure public.handle_updated_at();
create trigger documents_updated_at before update on public.documents
  for each row execute procedure public.handle_updated_at();

-- Supabase Storage Bucket
insert into storage.buckets (id, name, public) values ('hisako-documents', 'hisako-documents', false);

create policy "Authenticated users can manage own documents" on storage.objects for all using ( bucket_id = 'hisako-documents' and auth.role() = 'authenticated' );
