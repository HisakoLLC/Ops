-- ==============================================================================
-- HISAKO OPS — AOE LEADS MODULE UPGRADE SQL SCRIPT
-- Run this script in your Supabase SQL Editor to create the aoe_leads table.
-- ==============================================================================

create table if not exists public.aoe_leads (
  id                      uuid primary key default gen_random_uuid(),

  -- AOE identifiers
  aoe_lead_id             text not null,
  aoe_draft_id            text not null,
  source                  text not null default 'AOE',

  -- Status lifecycle
  status                  text not null default 'PENDING_REVIEW'
    check (status in (
      'PENDING_REVIEW',
      'APPROVED',
      'REJECTED',
      'EMAIL_1_SENT',
      'EMAIL_2_SENT',
      'EMAIL_3_SENT',
      'REPLIED',
      'CONVERTED',
      'ARCHIVED'
    )),

  -- Contact
  contact_name            text,
  contact_title           text,
  contact_email           text,
  company_name            text,
  company_url             text,

  -- Company intelligence (from AOE enrichment)
  value_proposition       text,
  target_audience         text,
  scaling_signals         text,
  strategic_hook          text,
  primary_pain_point      text,

  -- Qualification
  qualification_confidence text check (qualification_confidence in ('HIGH','MEDIUM','LOW')),
  qualification_reason    text,
  tier_1_passed           boolean default false,
  tier_2_passed           boolean default false,

  -- Email sequence — AOE drafts
  email_1_subject_a       text,
  email_1_subject_b       text,
  email_1_body            text,
  email_2_subject_a       text,
  email_2_subject_b       text,
  email_2_body            text,
  email_3_subject_a       text,
  email_3_subject_b       text,
  email_3_body            text,

  -- Reviewer's choices (which subject variant + any body edits)
  selected_subject_1      text,
  selected_subject_2      text,
  selected_subject_3      text,
  edited_body_1           text, -- null = use original email_1_body
  edited_body_2           text,
  edited_body_3           text,

  -- Internal
  notes                   text,
  reviewed_by             uuid references public.profiles(id),

  -- Conversion link
  converted_to_client_id  uuid references public.clients(id) on delete set null,

  -- Timestamps
  sent_at_1               timestamptz,
  sent_at_2               timestamptz,
  sent_at_3               timestamptz,
  replied_at              timestamptz,
  ingested_at             timestamptz,
  drafted_at              timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Prevent duplicate leads by AOE lead ID
create unique index if not exists aoe_leads_lead_id_idx on public.aoe_leads(aoe_lead_id);

-- Index for common queries
create index if not exists aoe_leads_status_idx on public.aoe_leads(status);
create index if not exists aoe_leads_email_idx on public.aoe_leads(contact_email);
create index if not exists aoe_leads_created_idx on public.aoe_leads(created_at desc);

-- RLS
alter table public.aoe_leads enable row level security;

drop policy if exists "Auth can read aoe_leads" on public.aoe_leads;
create policy "Auth can read aoe_leads" on public.aoe_leads
  for select using (auth.role() = 'authenticated');

drop policy if exists "Auth can update aoe_leads" on public.aoe_leads;
create policy "Auth can update aoe_leads" on public.aoe_leads
  for update using (auth.role() = 'authenticated');

drop policy if exists "Auth can insert aoe_leads" on public.aoe_leads;
create policy "Auth can insert aoe_leads" on public.aoe_leads
  for insert with check (true); -- API inserts without user session

-- updated_at trigger
drop trigger if exists aoe_leads_updated_at on public.aoe_leads;
create trigger aoe_leads_updated_at
  before update on public.aoe_leads
  for each row execute procedure public.handle_updated_at();
