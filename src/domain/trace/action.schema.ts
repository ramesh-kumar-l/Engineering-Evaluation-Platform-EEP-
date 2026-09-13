import { z } from 'zod';
import { actionIdSchema, runIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const ACTION_SCHEMA_VERSION = '1.0.0';

export const actionTypeSchema = z.enum([
  'file-read',
  'file-edit',
  'file-create',
  'file-delete',
  'command-run',
  'tool-call',
  'test-run',
]);
export type ActionType = z.infer<typeof actionTypeSchema>;

/** A concrete agent action taken during a run — see project-memory-bank/05-domain-model.md. */
export const actionSchema = z.object({
  schemaVersion: z.literal(ACTION_SCHEMA_VERSION),
  id: actionIdSchema,
  runId: runIdSchema,
  type: actionTypeSchema,
  target: z.string().min(1).optional(),
  detail: z.string().optional(),
  timestamp: isoTimestampSchema,
});

export type Action = z.infer<typeof actionSchema>;
