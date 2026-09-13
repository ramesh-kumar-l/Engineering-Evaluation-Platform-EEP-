import { z } from 'zod';
import { experimentIdSchema, taskIdSchema } from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';
import { isoTimestampSchema } from '../common/timestamps.js';
import { conditionSchema } from './condition.schema.js';

export const EXPERIMENT_SCHEMA_VERSION = '1.0.0';

/**
 * Composition of Task(s) + agent + model + conditions + evaluator/benchmark version, per
 * project-memory-bank/05-domain-model.md. All conditions in one experiment must share task,
 * agent, model, tools, environment and evaluator version — only the ContextProvider varies
 * (project-memory-bank/09-experiment-strategy.md), so those shared fields live here rather
 * than being duplicated per condition.
 */
export const experimentSchema = z.object({
  schemaVersion: z.literal(EXPERIMENT_SCHEMA_VERSION),
  id: experimentIdSchema,
  name: z.string().min(1),
  hypothesis: z.string().min(1),
  taskIds: z.array(taskIdSchema).min(1),
  conditions: z.array(conditionSchema).min(1),
  agentName: z.string().min(1),
  agentVersion: semVerSchema,
  modelName: z.string().min(1).optional(),
  modelVersion: z.string().min(1).optional(),
  evaluatorVersion: semVerSchema,
  benchmarkVersion: semVerSchema,
  createdAt: isoTimestampSchema,
});

export type Experiment = z.infer<typeof experimentSchema>;
