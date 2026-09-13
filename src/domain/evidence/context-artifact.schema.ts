import { z } from 'zod';
import { contextArtifactIdSchema, runIdSchema } from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const CONTEXT_ARTIFACT_SCHEMA_VERSION = '1.0.0';

/**
 * The concrete context payload handed to the agent by a ContextProvider for a given run —
 * see project-memory-bank/05-domain-model.md and 04-architecture.md.
 */
export const contextArtifactSchema = z.object({
  schemaVersion: z.literal(CONTEXT_ARTIFACT_SCHEMA_VERSION),
  id: contextArtifactIdSchema,
  runId: runIdSchema,
  providerName: z.string().min(1),
  providerVersion: semVerSchema,
  content: z.string(),
  tokenCount: z.number().int().nonnegative().optional(),
  redacted: z.boolean().default(false),
  createdAt: isoTimestampSchema,
});

export type ContextArtifact = z.infer<typeof contextArtifactSchema>;
