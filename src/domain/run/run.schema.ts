import { z } from 'zod';
import {
  conditionIdSchema,
  experimentIdSchema,
  outcomeIdSchema,
  runIdSchema,
  taskIdSchema,
  traceIdSchema,
} from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const RUN_SCHEMA_VERSION = '1.0.0';

/**
 * Minimum reproducibility metadata for a run — see
 * project-memory-bank/10-reproducibility.md §Required run metadata. Every field here must be
 * present so a result is interpretable purely from recorded metadata, independent of any
 * live system state.
 */
export const runMetadataSchema = z.object({
  taskVersion: semVerSchema,
  repositorySha: z.string().min(1),
  agentName: z.string().min(1),
  agentVersion: semVerSchema,
  modelName: z.string().min(1).optional(),
  modelVersion: z.string().min(1).optional(),
  contextProviderName: z.string().min(1),
  contextProviderVersion: semVerSchema,
  eepVersion: semVerSchema,
  evaluatorVersion: semVerSchema,
  benchmarkVersion: semVerSchema,
  environment: z.string().min(1),
  toolConfiguration: z.record(z.string(), z.unknown()).optional(),
  randomSeed: z.number().int().optional(),
});

export type RunMetadata = z.infer<typeof runMetadataSchema>;

/**
 * A single execution of a Condition against a Task; produces a Trace and an Outcome — see
 * project-memory-bank/05-domain-model.md.
 */
export const runSchema = z.object({
  schemaVersion: z.literal(RUN_SCHEMA_VERSION),
  id: runIdSchema,
  experimentId: experimentIdSchema,
  conditionId: conditionIdSchema,
  taskId: taskIdSchema,
  metadata: runMetadataSchema,
  traceId: traceIdSchema.optional(),
  outcomeId: outcomeIdSchema.optional(),
  startedAt: isoTimestampSchema,
  finishedAt: isoTimestampSchema.optional(),
});

export type Run = z.infer<typeof runSchema>;
