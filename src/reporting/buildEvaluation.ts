import { generateId } from '../domain/common/idGenerator.js';
import { isoTimestampSchema } from '../domain/common/timestamps.js';
import {
  EVALUATION_SCHEMA_VERSION,
  evaluationSchema,
  type Evaluation,
} from '../domain/evaluation/evaluation.schema.js';
import type { EvaluatedRunRecord } from './evaluatedRunInput.js';

/**
 * Builds the schema-valid `Evaluation` record for one evaluated run — the missing link between a
 * run's raw `Outcome`/`Metric[]`/`Verification[]` and a `Report`'s `evaluationIds`
 * (project-memory-bank/05-domain-model.md `Evaluation`). No caller anywhere in the codebase
 * constructed an `Evaluation` before Phase 9 (`evaluation.schema.ts` existed only as a validated
 * shape). `evaluatorVersion` is read from `record.run.metadata.evaluatorVersion` — the actually
 * recorded reproducibility metadata for that run (project-memory-bank/10-reproducibility.md) —
 * rather than taken as a separate parameter that could silently drift from what the Run itself
 * claims. Output is passed through `evaluationSchema.parse` so a malformed record fails loudly
 * rather than producing an Evaluation nothing downstream can trust.
 */
export function buildEvaluation(
  record: EvaluatedRunRecord,
  evaluatedAt: string = new Date().toISOString(),
): Evaluation {
  return evaluationSchema.parse({
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    id: generateId<'EvaluationId'>('evaluation'),
    runId: record.run.id,
    evaluatorVersion: record.run.metadata.evaluatorVersion,
    outcomeId: record.outcome.id,
    metricIds: record.metrics.map((metric) => metric.id),
    verificationIds: record.verifications.map((verification) => verification.id),
    evaluatedAt: isoTimestampSchema.parse(evaluatedAt),
  });
}
