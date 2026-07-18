-- ============================================================================
-- CONSOLIDATED DATABASE SETUP FOR AOE PIPELINE & OPS INTEGRATION
-- Run this script in your Supabase SQL Editor.
-- It forms all the tables, indexes, constraints, triggers, and security settings
-- required to run the Autonomous Outbound Engine (AOE) inside Hisako Ops.
-- ============================================================================

-- ── 0. HELPERS & UPDATED_AT TRIGGER ──────────────────────────────────────────
-- Creates a reusable function to update the updated_at column automatically.
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. aoe_pipeline_leads ────────────────────────────────────────────────────
-- Raw lead pipeline queue. Holds ingested leads as they move through enrichment,
-- qualification, and email drafting.
create table if not exists public.aoe_pipeline_leads (
  id                      uuid primary key default gen_random_uuid(),
  company_name            text not null,
  company_url             text not null,
  contact_email           text,
  contact_name            text,
  contact_title           text,
  status                  text not null default 'PENDING'
    check (status in (
      'PENDING', 'ENRICHING', 'ENRICHED',
      'QUALIFYING', 'QUALIFIED', 'DISQUALIFIED',
      'DRAFTING', 'DRAFTED', 'PUSHED_TO_OPS'
    )),
  enrichment_data         jsonb,
  strategic_hook          text,
  primary_pain_point      text,
  disqualification_reason text,
  retry_count             integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index if not exists aoe_pipeline_leads_company_url_idx on public.aoe_pipeline_leads(company_url);
create index if not exists aoe_pipeline_leads_status_idx on public.aoe_pipeline_leads(status);
create index if not exists aoe_pipeline_leads_created_idx on public.aoe_pipeline_leads(created_at desc);

alter table public.aoe_pipeline_leads disable row level security;

drop trigger if exists aoe_pipeline_leads_updated_at on public.aoe_pipeline_leads;
create trigger aoe_pipeline_leads_updated_at
  before update on public.aoe_pipeline_leads
  for each row execute function public.handle_updated_at();

-- ── 2. icp_config ────────────────────────────────────────────────────────────
-- Configurations for your Ideal Customer Profile (ICP) filters and services pitch.
create table if not exists public.icp_config (
  id                    uuid primary key default gen_random_uuid(),
  is_active             boolean not null default true,
  target_industries     text[] default '{}'::text[],
  excluded_industries   text[] default '{}'::text[],
  min_employee_count    integer,
  max_employee_count    integer,
  target_geographies    text[] default '{}'::text[],
  excluded_keywords     text[] default '{}'::text[],
  icp_description       text,
  service_framework     text,
  updated_at            timestamptz not null default now()
);

alter table public.icp_config disable row level security;

drop trigger if exists icp_config_updated_at on public.icp_config;
create trigger icp_config_updated_at
  before update on public.icp_config
  for each row execute function public.handle_updated_at();

-- Insert default single config row if table is completely empty
insert into public.icp_config (id, target_industries, service_framework, icp_description)
select gen_random_uuid(), '{}'::text[], 'B2B software engineering growth services.', 'Hyper-growth software and tech firms.'
where not exists (select 1 from public.icp_config);

-- ── 3. outbound_drafts ───────────────────────────────────────────────────────
-- Stores the 3-email cold sequence drafted by the Gemini AI.
create table if not exists public.outbound_drafts (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.aoe_pipeline_leads(id) on delete cascade,
  email_1_subject_a   text,
  email_1_subject_b   text,
  email_1_body        text,
  email_2_subject_a   text,
  email_2_subject_b   text,
  email_2_body        text,
  email_3_subject_a   text,
  email_3_subject_b   text,
  email_3_body        text,
  delivery_status     text not null default 'STAGED'
    check (delivery_status in ('STAGED', 'PUSHED', 'FAILED')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists outbound_drafts_lead_id_idx on public.outbound_drafts(lead_id);

alter table public.outbound_drafts disable row level security;

drop trigger if exists outbound_drafts_updated_at on public.outbound_drafts;
create trigger outbound_drafts_updated_at
  before update on public.outbound_drafts
  for each row execute function public.handle_updated_at();

-- ── 4. qualification_logs ────────────────────────────────────────────────────
-- Audit logging for qualification passes and fails (Tier 1 rules & Tier 2 Gemini check).
create table if not exists public.qualification_logs (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.aoe_pipeline_leads(id) on delete cascade,
  tier              integer not null check (tier in (1, 2)),
  result            text not null check (result in ('PASS', 'FAIL')),
  reason            text,
  llm_raw_response  jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists qual_logs_lead_id_idx on public.qualification_logs(lead_id);

alter table public.qualification_logs disable row level security;

-- ── 5. error_logs ────────────────────────────────────────────────────────────
-- Central log for pipeline ingestion, firecrawl scraping, and worker exceptions.
create table if not exists public.error_logs (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references public.aoe_pipeline_leads(id) on delete set null,
  worker          text not null
    check (worker in ('INGEST', 'ENRICHMENT', 'QUALIFICATION', 'DRAFTING', 'OPS_PUSH')),
  error_message   text not null,
  error_payload   jsonb,
  resolved        boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists error_logs_lead_id_idx on public.error_logs(lead_id);
create index if not exists error_logs_resolved_idx on public.error_logs(resolved);

alter table public.error_logs disable row level security;

-- ── 6. aoe_leads ─────────────────────────────────────────────────────────────
-- The final destination table. Holds complete leads + drafted email sequences 
-- pushed from the pipeline, awaiting review inside the Hisako Ops dashboard.
create table if not exists public.aoe_leads (
  id                      uuid primary key default gen_random_uuid(),
  aoe_lead_id             text not null,
  aoe_draft_id            text not null,
  source                  text not null default 'AOE',
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
  contact_name            text,
  contact_title           text,
  contact_email           text,
  company_name            text,
  company_url             text,
  value_proposition       text,
  target_audience         text,
  scaling_signals         text,
  strategic_hook          text,
  primary_pain_point      text,
  qualification_confidence text check (qualification_confidence in ('HIGH','MEDIUM','LOW')),
  qualification_reason    text,
  tier_1_passed           boolean default false,
  tier_2_passed           boolean default false,
  email_1_subject_a       text,
  email_1_subject_b       text,
  email_1_body            text,
  email_2_subject_a       text,
  email_2_subject_b       text,
  email_2_body            text,
  email_3_subject_a       text,
  email_3_subject_b       text,
  email_3_body            text,
  selected_subject_1      text,
  selected_subject_2      text,
  selected_subject_3      text,
  edited_body_1           text,
  edited_body_2           text,
  edited_body_3           text,
  notes                   text,
  reviewed_by             uuid references public.profiles(id) on delete set null,
  converted_to_client_id  uuid references public.clients(id) on delete set null,
  sent_at_1               timestamptz,
  sent_at_2               timestamptz,
  sent_at_3               timestamptz,
  replied_at              timestamptz,
  ingested_at             timestamptz,
  drafted_at              timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create unique index if not exists aoe_leads_lead_id_idx on public.aoe_leads(aoe_lead_id);
create index if not exists aoe_leads_status_idx on public.aoe_leads(status);
create index if not exists aoe_leads_email_idx on public.aoe_leads(contact_email);
create index if not exists aoe_leads_created_idx on public.aoe_leads(created_at desc);

alter table public.aoe_leads enable row level security;

-- Row Level Security policies for Hisako Ops users to review leads
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'aoe_leads' and policyname = 'Auth can read aoe_leads'
  ) then
    create policy "Auth can read aoe_leads" on public.aoe_leads
      for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'aoe_leads' and policyname = 'Auth can update aoe_leads'
  ) then
    create policy "Auth can update aoe_leads" on public.aoe_leads
      for update using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'aoe_leads' and policyname = 'Auth can insert aoe_leads'
  ) then
    create policy "Auth can insert aoe_leads" on public.aoe_leads
      for insert with check (true);
  end if;
end
$$;

drop trigger if exists aoe_leads_updated_at on public.aoe_leads;
create trigger aoe_leads_updated_at
  before update on public.aoe_leads
  for each row execute procedure public.handle_updated_at();
