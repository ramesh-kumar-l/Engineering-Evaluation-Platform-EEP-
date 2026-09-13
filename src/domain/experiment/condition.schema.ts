import { z } from 'zod';
import { conditionIdSchema } from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';

export const CONDITION_SCHEMA_VERSION = '1.0.0';

/**
 * One arm of an experiment (e.g. "Native", "ECC+Agent") — see
 * project-memory-bank/09-experiment-strategy.md for the initial A-D conditions.
 * `isOracle` must be set for any condition using curated/expert context, so reporting
 * layers can never present an oracle result as an achievable baseline.
 */
export const conditionSchema = z.object({
  schemaVersion: z.literal(CONDITION_SCHEMA_VERSION),
  id: conditionIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  contextProviderName: z.string().min(1),
  contextProviderVersion: semVerSchema,
  isOracle: z.boolean().default(false),
});

export type Condition = z.infer<typeof conditionSchema>;
