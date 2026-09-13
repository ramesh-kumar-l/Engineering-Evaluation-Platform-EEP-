import { z } from 'zod';

/**
 * Explicit run-outcome taxonomy from project-memory-bank/06-evaluation-methodology.md.
 * Infrastructure failures (ENVIRONMENT_FAILURE, TIMEOUT) must never be collapsed into
 * TASK_FAILURE or AGENT_FAILURE.
 */
export const RUN_STATUSES = [
  'SUCCESS',
  'TASK_FAILURE',
  'AGENT_FAILURE',
  'EVALUATION_FAILURE',
  'ENVIRONMENT_FAILURE',
  'TIMEOUT',
  'INCOMPLETE',
] as const;

export const runStatusSchema = z.enum(RUN_STATUSES);
export type RunStatus = z.infer<typeof runStatusSchema>;
