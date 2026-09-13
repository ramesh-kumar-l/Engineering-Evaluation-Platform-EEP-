import { z } from 'zod';
import { evaluationIdSchema, experimentIdSchema, reportIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const REPORT_SCHEMA_VERSION = '1.0.0';

/**
 * A human/machine-readable aggregation of Evaluations across Runs/Experiments — see
 * project-memory-bank/05-domain-model.md. `limitations` is required content, not an
 * afterthought: project-memory-bank/06-evaluation-methodology.md §Statistical discipline
 * mandates every public report state its limitations rather than making unqualified claims.
 */
export const reportSchema = z.object({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  id: reportIdSchema,
  experimentId: experimentIdSchema,
  title: z.string().min(1),
  evaluationIds: z.array(evaluationIdSchema).min(1),
  limitations: z.array(z.string().min(1)).default([]),
  generatedAt: isoTimestampSchema,
});

export type Report = z.infer<typeof reportSchema>;
