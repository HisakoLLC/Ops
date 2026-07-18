import { inngest } from '@/lib/inngest/client';

export function setupOpsPushMock() {
  // Intercept inngest.send so downstream events don't attempt external network requests
  inngest.send = async (events: any) => {
    const eventNames = Array.isArray(events) ? events.map((e: any) => e.name) : [events.name];
    console.log(`[Mock Inngest] Intercepted event emission:`, eventNames.join(', '));
    return { ids: ['mock-event-id'] };
  };
}
