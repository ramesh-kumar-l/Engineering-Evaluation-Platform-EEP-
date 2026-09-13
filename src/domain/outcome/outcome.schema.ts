import { z } from 'zod';
import { evidenceIdSchema, outcomeIdSchema, runIdSchema, verificationIdSchema } from '../common/ids.js';
import { runStatusSchema } from '../common/status.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const OUTCOME_SCHEMA_VERSION = '1.0.0';

/**
 * The final, explicit status of a run plus supporting evidence — see
 * project-memory-bank/05-domain-model.md and 06-evaluation-methodology.md §Explicit failure
 * taxonomy. `status` must reflect the true cause; infrastructure failures are never reported
 * as TASK_FAILURE or AGENT_FAILURE.
 */
export const outcomeSchema = z.object({
  schemaVersion: z.literal(OUTCOME_SCHEMA_VERSION),
  id: outcomeIdSchema,
  runId: runIdSchema,
  status: runStatusSchema,
  summary: z.string().min(1),
  verificationIds: z.array(verificationIdSchema).default([]),
  evidenceIds: z.array(evidenceIdSchema).default([]),
  finalizedAt: isoTimestampSchema,
});

export type Outcome = z.infer<typeof outcomeSchema>;
