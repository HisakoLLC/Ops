import { Document } from "docx";
import { buildNDA } from "./doc05-nda";
import { buildDiscoveryScript } from "./doc01-discovery-script";
import { buildIntakeQuestionnaire } from "./doc02-intake-questionnaire";
import { buildProposal } from "./doc03-proposal";
import { buildAgreement } from "./doc04-services-agreement";
import { buildOnboardingChecklist } from "./doc06-onboarding-checklist";
import { buildPipelineHandover } from "./doc07-pipeline-handover";
import { buildMonthlyReport } from "./doc08-monthly-report";
import { buildInvoice } from "./doc09-invoice";

export function buildDocument(docType: string, data: Record<string, any>): Document {
  const normalized = docType.replace(/-/g, "_");
  switch (normalized) {
    case "discovery_script": return buildDiscoveryScript(data);
    case "intake_questionnaire": return buildIntakeQuestionnaire(data);
    case "proposal": return buildProposal(data);
    case "services_agreement": return buildAgreement(data);
    case "nda": return buildNDA(data);
    case "onboarding_checklist": return buildOnboardingChecklist(data);
    case "pipeline_handover": return buildPipelineHandover(data);
    case "monthly_report": return buildMonthlyReport(data);
    case "invoice": return buildInvoice(data);
    default:
      throw new Error(`Unknown doc type: ${docType}`);
  }
}
