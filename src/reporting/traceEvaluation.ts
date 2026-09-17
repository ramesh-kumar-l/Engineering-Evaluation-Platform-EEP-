import type { EvaluationId } from '../domain/common/ids.js';
import type { Evaluation } from '../domain/evaluation/evaluation.schema.js';
import type { Evidence } from '../domain/evidence/evidence.schema.js';
import type { Metric } from '../domain/metric/metric.schema.js';
import type { Outcome } from '../domain/outcome/outcome.schema.js';
import type { Run } from '../domain/run/run.schema.js';
import type { Trace } from '../domain/trace/trace.schema.js';
import type { Verification } from '../domain/verification/verification.schema.js';
import type { ReportGraph } from './reportGraph.js';

export interface EvaluationTrace {
  readonly evaluation: Evaluation;
  readonly run: Run;
  readonly trace?: Trace;
  readonly outcome: Outcome;
  readonly metrics: readonly Metric[];
  readonly verifications: readonly Verification[];
  readonly evidence: readonly Evidence[];
}

/**
 * Thrown when a `ReportGraph` is internally inconsistent — an id one record references has no
 * matching record in the graph. This should never happen for a graph built by `buildReport()`
 * (every id it emits is drawn from a record already placed in the same graph); it exists to catch
 * a corrupted or hand-edited `report.json` loudly rather than silently returning a partial trace.
 */
export class BrokenReportGraphError extends Error {}

function findByIdOrThrow<T extends { readonly id: string }>(
  records: readonly T[],
  id: string,
  kind: string,
): T {
  const found = records.find((record) => record.id === id);
  if (!found) {
    throw new BrokenReportGraphError(`${kind} ${id} is referenced but not present in the report graph`);
  }
  return found;
}

/**
 * Drills one `Evaluation` down to every record that backs it — the concrete implementation of
 * project-memory-bank/12-dashboard-strategy.md's design principle ("Why should I trust this
 * result? Every aggregate metric must be drillable into underlying runs → trace → evidence →
 * evaluation decision. No black-box KPI."). Every id involved is resolved against the same
 * self-contained `ReportGraph`, never a live filesystem/database lookup.
 */
export function traceEvaluation(graph: ReportGraph, evaluationId: EvaluationId): EvaluationTrace {
  const evaluation = findByIdOrThrow(graph.evaluations, evaluationId, 'Evaluation');
  const run = findByIdOrThrow(graph.runs, evaluation.runId, 'Run');
  const outcome = findByIdOrThrow(graph.outcomes, evaluation.outcomeId, 'Outcome');
  const trace = graph.traces.find((candidate) => candidate.runId === run.id);
  const metricIds = new Set<string>(evaluation.metricIds);
  const verificationIds = new Set<string>(evaluation.verificationIds);
  const evidenceIds = new Set<string>(outcome.evidenceIds);

  return {
    evaluation,
    run,
    trace,
    outcome,
    metrics: graph.metrics.filter((metric) => metricIds.has(metric.id)),
    verifications: graph.verifications.filter((verification) => verificationIds.has(verification.id)),
    evidence: graph.evidence.filter((evidence) => evidenceIds.has(evidence.id)),
  };
}
