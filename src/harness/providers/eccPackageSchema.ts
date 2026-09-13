import { z } from 'zod';

/**
 * EEP's own independent mirror of ECC's documented `EngineeringContextPackage` contract (see
 * ECC's `project-memory-bank/02-architecture.md` §EngineeringContextPackage and its
 * `src/core/types/contextPackage.ts`). Deliberately re-declared here rather than imported — EEP
 * never depends on ECC's source, only on the external JSON shape its CLI documents and prints.
 * If ECC's package shape changes, this schema is the single place to update.
 */

export const eccTrustLevelSchema = z.enum(['fact', 'derived', 'inference', 'unknown']);

export const eccEvidenceSourceTypeSchema = z.enum([
  'code',
  'git',
  'pr',
  'issue',
  'documentation',
  'test',
  'ci',
  'runtime',
  'incident',
  'memory',
  'constraint',
]);

export const eccEvidenceProvenanceSchema = z.object({
  source: eccEvidenceSourceTypeSchema,
  identifier: z.string().optional(),
  path: z.string().optional(),
  lineRange: z.string().optional(),
  commit: z.string().optional(),
  timestamp: z.string().optional(),
  authority: z.enum(['low', 'medium', 'high']).optional(),
  freshness: z.enum(['current', 'stale', 'unknown']).optional(),
});

export const eccEvidenceItemSchema = z.object({
  source: eccEvidenceSourceTypeSchema,
  path: z.string().optional(),
  identifier: z.string().optional(),
  symbols: z.array(z.string()).optional(),
  relevance: z.number(),
  confidence: z.number().optional(),
  provenance: eccEvidenceProvenanceSchema.optional(),
  trustLevel: eccTrustLevelSchema,
});

export const eccEvidenceConflictSchema = z.object({
  subject: z.string(),
  items: z.array(eccEvidenceItemSchema),
});

export const eccHistoricalClaimSchema = z.object({
  claim: z.string(),
  trustLevel: eccTrustLevelSchema,
  source: z.object({ type: z.string(), id: z.string() }),
});

export const eccConstraintSchema = z.object({
  statement: z.string(),
  provenance: eccEvidenceProvenanceSchema,
});

export const eccExclusionSummarySchema = z.object({
  reason: z.string(),
  count: z.number(),
});

export const eccContextPackageSchema = z.object({
  version: z.string(),
  task: z.object({ type: z.string(), request: z.string() }),
  repository: z.object({ name: z.string(), commit: z.string() }),
  context: z.object({
    primary: z.array(eccEvidenceItemSchema),
    supporting: z.array(eccEvidenceItemSchema),
  }),
  conflicts: z.array(eccEvidenceConflictSchema),
  history: z.array(eccHistoricalClaimSchema),
  constraints: z.array(eccConstraintSchema),
  unknowns: z.array(z.string()),
  verification: z.array(z.string()),
  excluded: z.array(eccExclusionSummarySchema),
});

export type EccContextPackage = z.infer<typeof eccContextPackageSchema>;
