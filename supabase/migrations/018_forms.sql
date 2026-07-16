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

-- Authenticated team members can read/manage submissions
create policy "Auth can manage form_submissions" on public.form_submissions
  for all using (auth.role() = 'authenticated');

-- Anyone (including public landing page via anon key) can insert submissions
create policy "Anyone can submit form" on public.form_submissions
  for insert with check (true);

create trigger form_submissions_updated_at before update on public.form_submissions
  for each row execute procedure public.handle_updated_at();

-- Index for fast status and type queries
create index if not exists idx_form_submissions_status on public.form_submissions(status);
create index if not exists idx_form_submissions_form_type on public.form_submissions(form_type);
create index if not exists idx_form_submissions_created_at on public.form_submissions(created_at desc);
