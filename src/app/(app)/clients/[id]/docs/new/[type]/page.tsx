import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPES } from "@/lib/constants";
import { NDAForm } from "@/components/document-forms/NDAForm";
import { DiscoveryScriptForm } from "@/components/document-forms/DiscoveryScriptForm";
import { IntakeQuestionnaireForm } from "@/components/document-forms/IntakeQuestionnaireForm";
import { ProposalForm } from "@/components/document-forms/ProposalForm";
import { ServicesAgreementForm } from "@/components/document-forms/ServicesAgreementForm";
import { OnboardingChecklistForm } from "@/components/document-forms/OnboardingChecklistForm";
import { PipelineHandoverForm } from "@/components/document-forms/PipelineHandoverForm";
import { MonthlyReportForm } from "@/components/document-forms/MonthlyReportForm";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; type: string }>;
  searchParams: Promise<{ docId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const { id: clientId, type: docType } = resolvedParams;
  const docId = resolvedSearchParams.docId;

  const docConfig = DOC_TYPES.find((d) => d.key === docType);
  if (!docConfig) notFound();

  const supabase = await createClient();

  // Fetch client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) notFound();

  // Fetch settings
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  // Fetch existing document if regenerating
  let existingData = {};
  if (docId) {
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("form_data")
      .eq("id", docId)
      .single();
    if (existingDoc) existingData = existingDoc.form_data || {};
  }

  const renderForm = () => {
    switch (docType) {
      case "discovery-script":
        return <DiscoveryScriptForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "intake-questionnaire":
        return <IntakeQuestionnaireForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "proposal":
        return <ProposalForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "services-agreement":
        return <ServicesAgreementForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "nda":
        return <NDAForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "onboarding-checklist":
        return <OnboardingChecklistForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "pipeline-handover":
        return <PipelineHandoverForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      case "monthly-report":
        return <MonthlyReportForm client={client} settings={settings || {}} existingData={existingData} documentId={docId} docLabel={docConfig.label} />;
      default:
        return (
          <div className="text-center p-12 text-zinc-500 bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
            Form for {docConfig.label} is currently under construction.
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${clientId}?tab=documents`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{docId ? "Edit" : "New"} {docConfig.label}</h1>
          <p className="text-sm text-zinc-500">{client.company_name}</p>
        </div>
      </div>
      
      {renderForm()}
    </div>
  );
}
