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

export interface TeamInvite {
  id: string;
  email: string;
  invited_by: string | null;
  role: 'admin' | 'member';
  accepted: boolean;
  created_at: string;
}
