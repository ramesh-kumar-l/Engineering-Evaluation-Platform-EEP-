import type { RunId } from '../domain/common/ids.js';
import type { TaskCategory, TaskComplexity } from '../domain/task/task.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';

/**
 * Everything failure-clustering analysis needs about one completed run's verification results —
 * the same structural, one-way-dependency shape `RunAnalysisRecord` (analysisInput.ts) already
 * established for metrics, but carrying a run's `Verification[]` instead of its `Metric[]`.
 * Callers assemble this from a `Run` (conditionName resolved from its `Condition`), a `Task`
 * (category/complexity), and that run's `Verification[]` (from `runVerifiers`/`evaluateRun`, or a
 * dumped `RunResultBundle.verifications`).
 */
export interface RunVerificationRecord {
  readonly runId: RunId;
  readonly conditionName: string;
  readonly taskCategory: TaskCategory;
  readonly taskComplexity: TaskComplexity;
  readonly verifications: readonly Verification[];
}
