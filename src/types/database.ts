export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'member';
  avatar_url: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  company_legal_name: string | null;
  trading_name: string | null;
  email: string | null;
  website: string | null;
  registered_country: string | null;
  currency: string | null;
  deposit_percentage: number | null;
  payment_terms_days: number | null;
  late_payment_interest: number | null;
  retainer_notice_days: number | null;
  calendly_url: string | null;
  whatsapp_number: string | null;
  updated_at: string;
}

export interface Client {
  id: string;
  created_by: string | null;
  ref: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  country: string | null;
  pipeline_stage: 'lead' | 'discovery' | 'proposal' | 'signed' | 'build' | 'live' | 'retainer' | 'inactive' | 'churned';
  pipeline_value: number | null;
  retainer_amount: number | null;
  retainer_active: boolean;
  source: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  client_id: string;
  created_by: string | null;
  type: 'note' | 'call' | 'email' | 'meeting' | 'stage_change' | 'document_generated' | 'payment_received';
  title: string;
  body: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  created_by: string | null;
  doc_type: 'discovery_script' | 'intake_questionnaire' | 'proposal' | 'services_agreement' | 'nda' | 'onboarding_checklist' | 'pipeline_handover' | 'monthly_report';
  doc_label: string;
  form_data: Record<string, any>;
  storage_path: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  hourly_cost?: number;
}

export interface TeamInvite {
  id: string;
  email: string;
  invited_by: string | null;
  role: 'admin' | 'member';
  accepted: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  source: 'outbound' | 'referral' | 'inbound' | 'event' | 'other';
  industry: string | null;
  estimated_value: number | null;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'converted' | 'dead';
  notes: string | null;
  follow_up_date: string | null;
  assigned_to: string | null;
  converted_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string | null;
  invoice_ref: string | null;
  type: 'deposit' | 'final' | 'retainer' | 'adhoc';
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  line_items: Array<{ description: string; amount: number }>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: 'tools' | 'contractor' | 'marketing' | 'ops' | 'other';
  vendor: string | null;
  vendor_id: string | null;
  description: string;
  amount: number;
  currency: string;
  date: string;
  recurring: boolean;
  recurrence: 'monthly' | 'annual' | 'one-off' | null;
  receipt_url: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'automation' | 'ai_model' | 'crm' | 'email' | 'database' | 'communication' | 'infrastructure' | 'other';
  website: string | null;
  login_email: string | null;
  login_url: string | null;
  notes: string | null;
  is_client_tool: boolean;
  client_id: string | null;
  monthly_cost: number | null;
  billing_cycle: 'monthly' | 'annual' | 'usage' | 'free' | null;
  renewal_date: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  phase: 'map' | 'design' | 'build' | 'live' | 'retainer';
  status: 'on_track' | 'at_risk' | 'delayed' | 'complete';
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  client_id: string;
  project_id: string | null;
  task_id: string | null;
  logged_by: string;
  description: string;
  hours: number;
  date: string;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface KBCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface KBArticle {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doc {
  id: string
  content_type: 'article' | 'project' | 'product_doc'
  status: 'draft' | 'published' | 'archived'
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  tags: string[]
  reading_time_minutes: number | null
  author_id: string | null
  author_name_override: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  featured: boolean
  project_industry: string | null
  project_tools: string[] | null
  project_outcome: string | null
  project_client_name: string | null
  project_anonymous: boolean
  product_id: string | null
  section_id: string | null
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  category_id?: string | null
}

export interface DocProduct {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  version: string
  sort_order: number
}

export interface DocSection {
  id: string
  product_id: string
  name: string
  slug: string
  sort_order: number
}

export interface DocComment {
  id: string
  doc_id: string
  parent_id: string | null
  author_name: string
  author_email: string
  content: string
  approved: boolean
  created_at: string
}

export interface Media {
  id: string
  filename: string
  original_filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  alt_text: string
  folder: string
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export type AOELeadStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISQUALIFIED'
  | 'EMAIL_1_SENT'
  | 'EMAIL_2_SENT'
  | 'EMAIL_3_SENT'
  | 'REPLIED'
  | 'CONVERTED'
  | 'ARCHIVED'

export type QualificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface AOELead {
  id: string
  aoe_lead_id: string
  aoe_draft_id: string
  source: string
  status: AOELeadStatus
  contact_name: string | null
  contact_title: string | null
  contact_email: string | null
  company_name: string | null
  company_url: string | null
  value_proposition: string | null
  target_audience: string | null
  scaling_signals: string | null
  strategic_hook: string | null
  primary_pain_point: string | null
  qualification_confidence: QualificationConfidence | null
  qualification_reason: string | null
  tier_1_passed: boolean
  tier_2_passed: boolean
  email_1_subject_a: string | null
  email_1_subject_b: string | null
  email_1_body: string | null
  email_2_subject_a: string | null
  email_2_subject_b: string | null
  email_2_body: string | null
  email_3_subject_a: string | null
  email_3_subject_b: string | null
  email_3_body: string | null
  selected_subject_1: string | null
  selected_subject_2: string | null
  selected_subject_3: string | null
  edited_body_1: string | null
  edited_body_2: string | null
  edited_body_3: string | null
  notes: string | null
  reviewed_by: string | null
  converted_to_client_id: string | null
  sent_at_1: string | null
  sent_at_2: string | null
  sent_at_3: string | null
  replied_at: string | null
  ingested_at: string | null
  drafted_at: string | null
  created_at: string
  updated_at: string
}


// ── AOE Pipeline Types ─────────────────────────────────────────────────────

export type LeadStatus =
  | 'PENDING'
  | 'ENRICHING'
  | 'ENRICHED'
  | 'QUALIFYING'
  | 'QUALIFIED'
  | 'DISQUALIFIED'
  | 'DRAFTING'
  | 'DRAFTED'
  | 'PUSHED_TO_OPS';

export interface AoePipelineLead {
  id: string;
  company_name: string;
  company_url: string;
  contact_email: string | null;
  contact_name: string | null;
  contact_title: string | null;
  status: LeadStatus;
  enrichment_data: Record<string, any> | null;
  strategic_hook: string | null;
  primary_pain_point: string | null;
  disqualification_reason: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface IcpConfig {
  id: string;
  is_active: boolean;
  target_industries: string[];
  excluded_industries: string[];
  min_employee_count: number | null;
  max_employee_count: number | null;
  target_geographies: string[];
  excluded_keywords: string[];
  icp_description: string | null;
  service_framework: string | null;
  updated_at: string;
}

export interface OutboundDraft {
  id: string;
  lead_id: string;
  email_1_subject_a: string | null;
  email_1_subject_b: string | null;
  email_1_body: string | null;
  email_2_subject_a: string | null;
  email_2_subject_b: string | null;
  email_2_body: string | null;
  email_3_subject_a: string | null;
  email_3_subject_b: string | null;
  email_3_body: string | null;
  delivery_status: 'STAGED' | 'PUSHED' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface QualificationLog {
  id: string;
  lead_id: string;
  tier: 1 | 2;
  result: 'PASS' | 'FAIL';
  reason: string | null;
  llm_raw_response: Record<string, any> | null;
  created_at: string;
}

export interface AoeErrorLog {
  id: string;
  lead_id: string | null;
  worker: 'INGEST' | 'ENRICHMENT' | 'QUALIFICATION' | 'DRAFTING' | 'OPS_PUSH';
  error_message: string;
  error_payload: Record<string, any> | null;
  resolved: boolean;
  created_at: string;
}
