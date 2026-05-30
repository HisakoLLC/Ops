import { Document } from "docx";
import { buildNDA } from "./doc05-nda";
import { buildDiscoveryScript } from "./doc01-discovery-script";
import { buildIntakeQuestionnaire } from "./doc02-intake-questionnaire";
import { buildProposal } from "./doc03-proposal";
import { buildAgreement } from "./doc04-services-agreement";
import { buildOnboardingChecklist } from "./doc06-onboarding-checklist";
import { buildPipelineHandover } from "./doc07-pipeline-handover";
import { buildMonthlyReport } from "./doc08-monthly-report";

export function buildDocument(docType: string, data: Record<string, any>): Document {
  switch (docType) {
    case "discovery-script": return buildDiscoveryScript(data);
    case "intake-questionnaire": return buildIntakeQuestionnaire(data);
    case "proposal": return buildProposal(data);
    case "services-agreement": return buildAgreement(data);
    case "nda": return buildNDA(data);
    case "onboarding-checklist": return buildOnboardingChecklist(data);
    case "pipeline-handover": return buildPipelineHandover(data);
    case "monthly-report": return buildMonthlyReport(data);
    default:
      return buildNDA(data);
  }
}
