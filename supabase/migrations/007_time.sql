-- Add hourly_cost to profiles
alter table public.profiles add column hourly_cost numeric(8,2) default 0.00;

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  logged_by uuid references public.profiles(id) not null,
  description text not null,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  date date not null default current_date,
  billable boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.time_entries enable row level security;
create policy "Auth CRUD time entries" on public.time_entries
  using (auth.role()='authenticated')
  with check (auth.role()='authenticated');

create trigger time_entries_updated_at before update on public.time_entries
  for each row execute procedure public.handle_updated_at();
