import { z } from 'zod';
import { decisionIdSchema, runIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const DECISION_SCHEMA_VERSION = '1.0.0';

/**
 * A point where the agent chose an approach, captured for later quality/risk analysis — see
 * project-memory-bank/05-domain-model.md.
 */
export const decisionSchema = z.object({
  schemaVersion: z.literal(DECISION_SCHEMA_VERSION),
  id: decisionIdSchema,
  runId: runIdSchema,
  description: z.string().min(1),
  alternativesConsidered: z.array(z.string().min(1)).default([]),
  rationale: z.string().optional(),
  timestamp: isoTimestampSchema,
});

export type Decision = z.infer<typeof decisionSchema>;
