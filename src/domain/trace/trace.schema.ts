import { z } from 'zod';
import { contextArtifactIdSchema, runIdSchema, traceIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';
import { actionSchema } from './action.schema.js';
import { decisionSchema } from './decision.schema.js';

export const TRACE_SCHEMA_VERSION = '1.0.0';

/**
 * Full captured lifecycle of one run: context received, actions taken, decisions made,
 * retries, and whether redaction was applied — see project-memory-bank/05-domain-model.md
 * and 11-security.md §Redaction.
 */
export const traceSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  id: traceIdSchema,
  runId: runIdSchema,
  contextArtifactId: contextArtifactIdSchema.optional(),
  actions: z.array(actionSchema).default([]),
  decisions: z.array(decisionSchema).default([]),
  retries: z.number().int().nonnegative().default(0),
  redactionApplied: z.boolean().default(false),
  startedAt: isoTimestampSchema,
  endedAt: isoTimestampSchema.optional(),
});

export type Trace = z.infer<typeof traceSchema>;
