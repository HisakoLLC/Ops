-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  invoice_ref text unique,
  type text not null check (type in ('deposit','final','retainer','adhoc')),
  amount numeric(10,2) not null,
  currency text default 'USD',
  status text not null default 'draft'
    check (status in ('draft','sent','paid','overdue','cancelled')),
  issued_date date,
  due_date date,
  paid_date date,
  description text,
  line_items jsonb default '[]',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Authenticated can CRUD invoices" on public.invoices
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-generate invoice ref
create or replace function public.generate_invoice_ref()
returns trigger as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq integer;
begin
  select count(*) + 1 into seq from public.invoices
    where extract(year from created_at) = extract(year from now());
  new.invoice_ref := 'INV-' || year_str || '-' || lpad(seq::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_invoice_ref before insert on public.invoices
  for each row execute procedure public.generate_invoice_ref();

create trigger invoices_updated_at before update on public.invoices
  for each row execute procedure public.handle_updated_at();

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in
    ('tools','contractor','marketing','ops','other')),
  vendor text,
  vendor_id uuid,
  description text not null,
  amount numeric(10,2) not null,
  currency text default 'USD',
  date date not null default current_date,
  recurring boolean default false,
  recurrence text check (recurrence in ('monthly','annual','one-off')),
  receipt_url text,
  logged_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Authenticated can CRUD expenses" on public.expenses
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
