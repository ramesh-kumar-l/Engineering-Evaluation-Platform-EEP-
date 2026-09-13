import { z } from 'zod';
import { taskIdSchema } from '../common/ids.js';
import { semVerSchema } from '../common/semver.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const TASK_SCHEMA_VERSION = '1.0.0';

/** Distribution target: project-memory-bank/07-benchmark-strategy.md. */
export const taskCategorySchema = z.enum([
  'debugging',
  'feature',
  'refactoring',
  'test-generation',
  'migration',
  'performance',
  'code-review',
  'architecture',
]);
export type TaskCategory = z.infer<typeof taskCategorySchema>;

/** L1 trivial through L5 architectural/systemic — see 07-benchmark-strategy.md. */
export const taskComplexitySchema = z.enum(['L1', 'L2', 'L3', 'L4', 'L5']);
export type TaskComplexity = z.infer<typeof taskComplexitySchema>;

export const taskRepositoryRefSchema = z.object({
  url: z.string().min(1),
  commitSha: z.string().min(1),
});
export type TaskRepositoryRef = z.infer<typeof taskRepositoryRefSchema>;

/**
 * Canonical, versioned unit of engineering work to be attempted. See
 * project-memory-bank/05-domain-model.md for the entity's role in the overall model.
 */
export const taskSchema = z.object({
  schemaVersion: z.literal(TASK_SCHEMA_VERSION),
  id: taskIdSchema,
  taskVersion: semVerSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  category: taskCategorySchema,
  complexity: taskComplexitySchema,
  repository: taskRepositoryRefSchema,
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  verificationMethod: z.string().min(1),
  groundTruth: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
  createdAt: isoTimestampSchema,
});

export type Task = z.infer<typeof taskSchema>;
