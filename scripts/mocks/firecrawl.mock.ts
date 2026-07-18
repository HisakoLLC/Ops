import FirecrawlApp from '@mendable/firecrawl-js';

export const MOCK_FIRECRAWL_MARKDOWN = `# ScaleOps - Next-Gen DevOps Automation Platform

Welcome to ScaleOps. We build automated continuous deployment and infrastructure management software for modern SaaS engineering teams. Our platform cuts pipeline failure rates by 80% and automates cloud cost optimization.

## About Us
Founded in 2024, ScaleOps serves hyper-growth B2B software companies who struggle with complex microservices orchestration.

## Latest News
We are excited to announce our $15M Series A funding round led by Venture Partners to accelerate our product roadmap and expand geographically into Europe!

## Careers
We are actively hiring Senior Kubernetes Engineers, Site Reliability Engineers, and Go developers to support our scaling infrastructure. Join our fast-growing engineering team!`;

export function setupFirecrawlMock() {
  FirecrawlApp.prototype.scrapeUrl = async (url: string, options?: any) => {
    console.log(`[Mock Firecrawl] Intercepted scrapeUrl for: ${url}`);
    return {
      success: true,
      markdown: MOCK_FIRECRAWL_MARKDOWN,
    };
  };
}
