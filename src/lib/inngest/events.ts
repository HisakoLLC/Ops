import { eventType, staticSchema } from 'inngest';

export const leadIngested = eventType('aoe/lead.ingested', {
  schema: staticSchema<{ lead_id: string }>(),
});

export const leadEnriched = eventType('aoe/lead.enriched', {
  schema: staticSchema<{ lead_id: string }>(),
});

export const leadQualified = eventType('aoe/lead.qualified', {
  schema: staticSchema<{ lead_id: string }>(),
});

export const leadDrafted = eventType('aoe/lead.drafted', {
  schema: staticSchema<{ lead_id: string; draft_id: string }>(),
});

export const leadPushedToOps = eventType('aoe/lead.pushed_to_ops', {
  schema: staticSchema<{ lead_id: string; draft_id: string }>(),
});

export const AOE_EVENTS = {
  LEAD_INGESTED: leadIngested,
  LEAD_ENRICHED: leadEnriched,
  LEAD_QUALIFIED: leadQualified,
  LEAD_DRAFTED: leadDrafted,
  LEAD_PUSHED_TO_OPS: leadPushedToOps,
} as const;

export type LeadEventPayload = {
  data: {
    lead_id: string;
  };
};

export type AoeEvents = {
  'aoe/lead.ingested': LeadEventPayload;
  'aoe/lead.enriched': LeadEventPayload;
  'aoe/lead.qualified': LeadEventPayload;
  'aoe/lead.drafted': {
    data: {
      lead_id: string;
      draft_id: string;
    };
  };
  'aoe/lead.pushed_to_ops': {
    data: {
      lead_id: string;
      draft_id: string;
    };
  };
};
