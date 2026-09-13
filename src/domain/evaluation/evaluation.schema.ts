import { z } from 'zod';
import {
  evaluationIdSchema,
  metricIdSchema,
  outcomeIdSchema,
  runIdSchema,
  verificationIdSchema,
} from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const EVALUATION_SCHEMA_VERSION = '1.0.0';

/**
 * The judged result of applying Verification + Metrics to a Run's Outcome, versioned against
 * an evaluator version — see project-memory-bank/05-domain-model.md. Per
 * project-memory-bank/10-reproducibility.md §Immutability policy, a correction to a finalized
 * evaluation is recorded as a new Evaluation that sets `supersedesEvaluationId`, never as a
 * mutation of the original.
 */
export const evaluationSchema = z.object({
  schemaVersion: z.literal(EVALUATION_SCHEMA_VERSION),
  id: evaluationIdSchema,
  runId: runIdSchema,
  evaluatorVersion: semVerSchema,
  outcomeId: outcomeIdSchema,
  metricIds: z.array(metricIdSchema).default([]),
  verificationIds: z.array(verificationIdSchema).default([]),
  supersedesEvaluationId: evaluationIdSchema.optional(),
  notes: z.string().optional(),
  evaluatedAt: isoTimestampSchema,
});

export type Evaluation = z.infer<typeof evaluationSchema>;
