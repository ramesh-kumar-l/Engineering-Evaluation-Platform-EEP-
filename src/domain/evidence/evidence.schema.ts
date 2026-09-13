import { z } from 'zod';
import { evidenceIdSchema } from '../common/ids.js';
import { isoTimestampSchema } from '../common/timestamps.js';

export const EVIDENCE_SCHEMA_VERSION = '1.0.0';

export const evidenceKindSchema = z.enum([
  'file',
  'test-result',
  'doc-snippet',
  'provenance-record',
  'diff',
  'log',
]);
export type EvidenceKind = z.infer<typeof evidenceKindSchema>;

/**
 * A discrete piece of information used to support a Decision or an Evaluation — see
 * project-memory-bank/05-domain-model.md. `redacted` supports the configurable-redaction
 * requirement in 11-security.md.
 */
export const evidenceSchema = z.object({
  schemaVersion: z.literal(EVIDENCE_SCHEMA_VERSION),
  id: evidenceIdSchema,
  kind: evidenceKindSchema,
  description: z.string().min(1),
  source: z.string().min(1),
  content: z.string().optional(),
  redacted: z.boolean().default(false),
  createdAt: isoTimestampSchema,
});

export type Evidence = z.infer<typeof evidenceSchema>;
