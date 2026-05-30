export const PIPELINE_STAGES = [
  { value: 'lead', label: 'Lead', color: 'bg-zinc-400', description: 'New inquiry' },
  { value: 'discovery', label: 'Discovery', color: 'bg-blue-400', description: 'Gathering requirements' },
  { value: 'proposal', label: 'Proposal', color: 'bg-yellow-400', description: 'Proposal sent' },
  { value: 'signed', label: 'Signed', color: 'bg-orange-400', description: 'Contract signed' },
  { value: 'build', label: 'Build', color: 'bg-purple-400', description: 'In development' },
  { value: 'live', label: 'Live', color: 'bg-green-400', description: 'Project deployed' },
  { value: 'retainer', label: 'Retainer', color: 'bg-emerald-600', description: 'Active retainer' },
  { value: 'inactive', label: 'Inactive', color: 'bg-zinc-200', description: 'Currently inactive' },
  { value: 'churned', label: 'Churned', color: 'bg-red-400', description: 'No longer a client' }
] as const;

export const DOC_TYPES = [
  { key: 'discovery_script', label: 'Discovery Script', description: 'Script and scoring for initial discovery calls' },
  { key: 'intake_questionnaire', label: 'Intake Questionnaire', description: 'Detailed requirements gathering' },
  { key: 'proposal', label: 'Proposal', description: 'Project proposal and fee structure' },
  { key: 'services_agreement', label: 'Services Agreement', description: 'Master services agreement contract' },
  { key: 'nda', label: 'NDA', description: 'Non-disclosure agreement' },
  { key: 'onboarding_checklist', label: 'Onboarding Checklist', description: 'Client onboarding steps and tool access' },
  { key: 'pipeline_handover', label: 'Pipeline Handover', description: 'Technical documentation for delivered pipelines' },
  { key: 'monthly_report', label: 'Monthly Report', description: 'Performance and value metrics report' }
] as const;
