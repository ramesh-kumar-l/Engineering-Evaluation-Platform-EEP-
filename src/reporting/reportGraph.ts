import type { ContextArtifact } from '../domain/evidence/context-artifact.schema.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Evaluation } from '../domain/evaluation/evaluation.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Report } from '../domain/report/report.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';

/**
 * A canonical, self-contained, schema-validated Report plus the full entity graph it aggregates
 * — see project-memory-bank/05-domain-model.md `Report` and 10-reproducibility.md ("Every public
 * claim EEP produces... must be traceable back through report → aggregate metric → individual
 * run → trace → evidence → evaluation decision"). This is the persisted replacement for the
 * throwaway per-run dump in `src/experiments/resultsWriter.ts`: instead of scattered raw bundles
 * with no cross-referencing guarantee, a `ReportGraph` is one canonical artifact where every id
 * referenced by `report.evaluationIds` (and by each `Evaluation`/`Outcome`) resolves to a record
 * present in this same object. Every array is deduplicated by `id` (`dedupeById.ts`) — the same
 * underlying `Run`/`Metric`/`Evidence` record is never repeated even if referenced by more than
 * one Evaluation.
 */
export interface ReportGraph {
  readonly report: Report;
  readonly evaluations: readonly Evaluation[];
  readonly runs: readonly Run[];
  readonly traces: readonly Trace[];
  readonly outcomes: readonly Outcome[];
  readonly metrics: readonly Metric[];
  readonly verifications: readonly Verification[];
  readonly evidence: readonly Evidence[];
  readonly contextArtifacts: readonly ContextArtifact[];
}
