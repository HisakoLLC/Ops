create table if not exists public.doc_revisions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.docs(id) on delete cascade,
  title text not null,
  content text not null,
  excerpt text,
  slug text,
  status text,
  category_id uuid references public.doc_categories(id) on delete set null,
  tags text[],
  author_id uuid references public.profiles(id) on delete set null,
  revision_notes text default '',
  created_at timestamptz default now()
);

alter table public.doc_revisions enable row level security;

create policy "Auth can read and manage doc revisions" on public.doc_revisions
  for all using (auth.role() = 'authenticated');

create index if not exists idx_doc_revisions_doc_id on public.doc_revisions(doc_id);
create index if not exists idx_doc_revisions_created_at on public.doc_revisions(created_at desc);

-- Trigger function to snapshot document before update
create or replace function public.snapshot_doc_before_update()
returns trigger as $$
begin
  if (OLD.title is distinct from NEW.title) or 
     (OLD.content is distinct from NEW.content) or 
     (OLD.status is distinct from NEW.status) or
     (OLD.category_id is distinct from NEW.category_id) then
    insert into public.doc_revisions (
      doc_id, title, content, excerpt, slug, status, category_id, tags, author_id, revision_notes, created_at
    ) values (
      OLD.id, OLD.title, OLD.content, OLD.excerpt, OLD.slug, OLD.status, OLD.category_id, OLD.tags, OLD.author_id, 
      coalesce(NEW.title || ' updated', 'Auto-saved revision'), now()
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists create_doc_revision_on_update on public.docs;
create trigger create_doc_revision_on_update
  before update on public.docs
  for each row execute procedure public.snapshot_doc_before_update();
