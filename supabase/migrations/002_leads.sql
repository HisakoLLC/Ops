create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_linkedin text,
  source text check (source in ('outbound','referral','inbound','event','other'))
    default 'inbound',
  industry text,
  estimated_value numeric(10,2),
  status text check (status in
    ('new','contacted','responded','qualified','converted','dead'))
    default 'new',
  notes text,
  follow_up_date date,
  assigned_to uuid references public.profiles(id),
  converted_to uuid references public.clients(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.leads enable row level security;
create policy "Authenticated users can CRUD leads" on public.leads
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create trigger leads_updated_at before update on public.leads
  for each row execute procedure public.handle_updated_at();
