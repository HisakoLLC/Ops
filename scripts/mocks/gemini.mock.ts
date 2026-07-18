import { GoogleGenAI } from '@google/genai';

export function setupGeminiMock() {
  const mockGenerateContent = async (params: any) => {
    const promptStr = JSON.stringify(params.contents || params || []).toLowerCase();
    let contentJson = '{}';

    if (promptStr.includes('intelligence analyst')) {
      console.log('[Mock Gemini] Intercepted Enrichment extraction call');
      contentJson = JSON.stringify({
        value_proposition: "ScaleOps provides automated continuous deployment and infrastructure management software for hyper-growth B2B SaaS engineering teams.",
        target_audience: "Modern B2B software companies and DevOps engineering teams managing complex microservices.",
        scaling_signals: "ScaleOps recently announced a $15M Series A funding round and is actively hiring Senior Kubernetes Engineers and SREs to support infrastructure growth.",
        strategic_hook: "Congrats on the recent $15M Series A and rapid engineering team expansion.",
        primary_pain_point: "Managing complex microservices orchestration and preventing cloud infrastructure bottlenecks during rapid scaling."
      });
    } else if (promptStr.includes('sales qualification expert')) {
      console.log('[Mock Gemini] Intercepted Qualification call');
      contentJson = JSON.stringify({
        qualified: true,
        confidence: "HIGH",
        reason: "ScaleOps clearly matches our Ideal Customer Profile as a well-funded SaaS tech company actively expanding its engineering team and managing complex scaling infrastructure."
      });
    } else if (promptStr.includes('cold email copywriter')) {
      console.log('[Mock Gemini] Intercepted Drafting call');
      contentJson = JSON.stringify({
        email_1: {
          subject_a: "Congrats on the Series A, Jordan",
          subject_b: "ScaleOps DevOps scaling",
          body: "Hi Jordan,\n\nCongrats on the recent $15M Series A and rapid engineering team expansion at ScaleOps.\n\nAs you hire more Kubernetes engineers to scale your infrastructure, managing microservice bottlenecks often becomes a hidden drain on engineering velocity.\n\nWe help hyper-growth SaaS teams automate infrastructure optimization to keep deployments seamless.\n\nWould you be open to comparing notes on how your DevOps team handles pipeline velocity?"
        },
        email_2: {
          subject_a: "Re: Congrats on the Series A, Jordan",
          subject_b: "DevOps velocity at ScaleOps",
          body: "Hi Jordan,\n\nFollowing up on my note regarding engineering velocity at ScaleOps.\n\nWe recently helped another Series A SaaS platform cut their cloud deployment failures by 80% while saving 20h/week of engineering time.\n\nWorth a brief conversation next week?"
        },
        email_3: {
          subject_a: "Closing the loop",
          subject_b: "Should I close your file?",
          body: "Hi Jordan,\n\nI haven't heard back, so I'll assume optimizing DevOps pipeline infrastructure isn't a priority for ScaleOps right now.\n\nI'll close your file on our end. If things change as your new engineering hires onboard, feel free to reach out."
        }
      });
    } else {
      console.warn('[Mock Gemini] Unknown prompt intercepted');
    }

    return {
      text: contentJson
    } as any;
  };

  // Mock ai.models.generateContent globally
  Object.defineProperty(GoogleGenAI.prototype, 'models', {
    get() {
      return {
        generateContent: mockGenerateContent,
      };
    },
    configurable: true,
  });
}
