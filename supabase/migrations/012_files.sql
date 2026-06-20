-- Create a table for managing uploaded files
create table public.ops_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  file_type text not null,
  size_bytes bigint not null default 0,
  
  -- Optional entity linking
  entity_type text,
  entity_id uuid,
  
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ops_files enable row level security;

-- Auth can read all files
create policy "Auth can read all files" on public.ops_files
  for select using (auth.role() = 'authenticated');

-- Auth can insert files
create policy "Auth can insert files" on public.ops_files
  for insert with check (auth.role() = 'authenticated');

-- Auth can update files
create policy "Auth can update files" on public.ops_files
  for update using (auth.role() = 'authenticated');

-- Auth can delete files
create policy "Auth can delete files" on public.ops_files
  for delete using (auth.role() = 'authenticated');

-- Auto-update updated_at
create trigger ops_files_updated_at before update on public.ops_files
  for each row execute procedure public.handle_updated_at();

-- Add a storage bucket for these files
insert into storage.buckets (id, name, public) values ('ops_files', 'ops_files', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public can view ops_files bucket" on storage.objects
  for select using (bucket_id = 'ops_files');

create policy "Auth can insert into ops_files bucket" on storage.objects
  for insert with check (bucket_id = 'ops_files' and auth.role() = 'authenticated');

create policy "Auth can update ops_files bucket" on storage.objects
  for update using (bucket_id = 'ops_files' and auth.role() = 'authenticated');

create policy "Auth can delete ops_files bucket" on storage.objects
  for delete using (bucket_id = 'ops_files' and auth.role() = 'authenticated');
