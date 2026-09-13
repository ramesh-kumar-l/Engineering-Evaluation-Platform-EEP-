import { z } from 'zod';
import { evidenceIdSchema, runIdSchema, verificationIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const VERIFICATION_SCHEMA_VERSION = '1.0.0';

/** See project-memory-bank/06-evaluation-methodology.md §Multi-evidence outcome evaluation. */
export const verificationMethodSchema = z.enum([
  'test-suite',
  'static-analysis',
  'diff-analysis',
  'repository-invariant',
  'acceptance-criteria-check',
  'security-check',
  'architecture-check',
  'human-review',
  'llm-judge',
]);
export type VerificationMethod = z.infer<typeof verificationMethodSchema>;

/**
 * The check(s) applied to determine whether a run's output satisfies the Task's acceptance
 * criteria — see project-memory-bank/05-domain-model.md. `llm-judge` results must never be
 * the sole basis for an Outcome (06-evaluation-methodology.md).
 */
export const verificationSchema = z.object({
  schemaVersion: z.literal(VERIFICATION_SCHEMA_VERSION),
  id: verificationIdSchema,
  runId: runIdSchema,
  method: verificationMethodSchema,
  passed: z.boolean(),
  detail: z.string().optional(),
  evidenceIds: z.array(evidenceIdSchema).default([]),
  timestamp: isoTimestampSchema,
});

export type Verification = z.infer<typeof verificationSchema>;
