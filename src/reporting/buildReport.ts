import { generateId } from '../domain/common/idGenerator.js';
import type { ExperimentId } from '../domain/common/ids.js';
import { isoTimestampSchema } from '../domain/common/timestamps.js';
import { REPORT_SCHEMA_VERSION, reportSchema } from '../domain/report/report.schema.js';
import { buildEvaluation } from './buildEvaluation.js';
import { dedupeById } from './dedupeById.js';
import type { EvaluatedRunRecord } from './evaluatedRunInput.js';
import type { ReportGraph } from './reportGraph.js';

export interface BuildReportOptions {
  readonly title: string;
  /** Named limitations this report is subject to — required content, not an afterthought; see
   *  project-memory-bank/06-evaluation-methodology.md §Statistical discipline. */
  readonly limitations?: readonly string[];
  readonly generatedAt?: string;
}

/**
 * Builds the canonical, schema-validated `ReportGraph` for one experiment's evaluated runs — the
 * Phase 9 replacement for reading raw `experiment-results/` bundles directly
 * (project-memory-bank/13-roadmap.md Phase 9 row, project-memory-bank/14-decisions.md ADR-013's
 * "Phase 9's canonical Report/persistence format doesn't exist yet" note). One `Evaluation` is
 * built per run (`buildEvaluation.ts`); every underlying `Run`/`Trace`/`Outcome`/`Metric`/
 * `Verification`/`Evidence`/`ContextArtifact` referenced by those Evaluations is carried alongside
 * the `Report` itself in the same object, deduplicated by id, so the whole traceability chain in
 * project-memory-bank/10-reproducibility.md ("report → aggregate metric → individual run → trace
 * → evidence → evaluation decision") resolves from one self-contained artifact — see
 * `traceEvaluation.ts` for the drill-down reader.
 */
export function buildReport(
  records: readonly EvaluatedRunRecord[],
  experimentId: ExperimentId,
  options: BuildReportOptions,
): ReportGraph {
  if (records.length === 0) {
    throw new Error(`Cannot build a report for experiment ${experimentId} with zero evaluated runs`);
  }

  const generatedAt = isoTimestampSchema.parse(options.generatedAt ?? new Date().toISOString());
  const evaluations = records.map((record) => buildEvaluation(record, generatedAt));

  const report = reportSchema.parse({
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: generateId<'ReportId'>('report'),
    experimentId,
    title: options.title,
    evaluationIds: evaluations.map((evaluation) => evaluation.id),
    limitations: options.limitations ?? [],
    generatedAt,
  });

  return {
    report,
    evaluations,
    runs: dedupeById(records.map((record) => record.run)),
    traces: dedupeById(records.flatMap((record) => (record.trace ? [record.trace] : []))),
    outcomes: dedupeById(records.map((record) => record.outcome)),
    metrics: dedupeById(records.flatMap((record) => record.metrics)),
    verifications: dedupeById(records.flatMap((record) => record.verifications)),
    evidence: dedupeById(records.flatMap((record) => record.evidence)),
    contextArtifacts: dedupeById(
      records.flatMap((record) => (record.contextArtifact ? [record.contextArtifact] : [])),
    ),
  };
}
