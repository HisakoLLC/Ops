create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  description text,
  phase text check (phase in ('map','design','build','live','retainer'))
    default 'map',
  status text check (status in ('on_track','at_risk','delayed','complete'))
    default 'on_track',
  start_date date,
  target_end_date date,
  actual_end_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  status text check (status in ('todo','in_progress','blocked','done'))
    default 'todo',
  priority text check (priority in ('low','medium','high','urgent'))
    default 'medium',
  due_date date,
  completed_at timestamptz,
  sort_order integer default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.milestones enable row level security;
create policy "Auth CRUD projects" on public.projects using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Auth CRUD tasks" on public.tasks using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Auth CRUD milestones" on public.milestones using (auth.role()='authenticated') with check (auth.role()='authenticated');

create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();
