create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in (
    'automation','ai_model','crm','email','database',
    'communication','infrastructure','other'
  )),
  website text,
  login_email text,
  login_url text,
  notes text,
  is_client_tool boolean default false,
  client_id uuid references public.clients(id) on delete set null,
  monthly_cost numeric(8,2),
  billing_cycle text check (billing_cycle in ('monthly','annual','usage','free')),
  renewal_date date,
  active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vendors enable row level security;

create policy "Authenticated can CRUD vendors" on public.vendors
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create trigger vendors_updated_at before update on public.vendors
  for each row execute procedure public.handle_updated_at();
