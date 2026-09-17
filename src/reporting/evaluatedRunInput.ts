import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';

/**
 * One fully evaluated run — the reporting layer's structural input type, decoupled from
 * `src/experiments/resultsWriter.ts`'s `RunResultBundle` the same way `src/analysis/
 * analysisInput.ts`'s `RunAnalysisRecord` is decoupled from `harness`/`evaluation` types
 * (project-memory-bank/14-decisions.md ADR-011). This keeps `src/reporting/` a pure, reusable
 * layer over `src/domain/` alone — it has no dependency on how a run's data was produced or
 * where it was dumped; `src/experiments/generateReport.ts` is the one place that adapts
 * `RunResultBundle` into this shape, mirroring how `analyzeComparisonResults.ts` already adapts
 * it into `RunAnalysisRecord`/`RunVerificationRecord`. Condition/task labels are deliberately not
 * part of this type — traceability at this layer runs through `Run.conditionId`/`Run.taskId`,
 * not a human-readable label.
 */
export interface EvaluatedRunRecord {
  readonly run: Run;
  readonly trace?: Trace;
  readonly outcome: Outcome;
  readonly verifications: readonly Verification[];
  readonly evidence: readonly Evidence[];
  readonly metrics: readonly Metric[];
  readonly contextArtifact?: ContextArtifact;
}
