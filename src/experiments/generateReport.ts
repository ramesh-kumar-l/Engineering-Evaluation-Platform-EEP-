import { pathToFileURL } from 'node:url';
import type { ExperimentId } from '../domain/common/ids.js';
import { buildReport } from '../reporting/buildReport.js';
import type { EvaluatedRunRecord } from '../reporting/evaluatedRunInput.js';
import type { ReportGraph } from '../reporting/reportGraph.js';
import { defaultReportsDir, writeReport } from '../reporting/reportWriter.js';
import { defaultResultsDir, latestExperimentId, readAllRunResults, type RunResultBundle } from './resultsWriter.js';

export interface GenerateReportOptions {
  readonly resultsDir?: string;
  readonly reportsDir?: string;
  readonly title?: string;
  readonly limitations?: readonly string[];
}

export interface GenerateReportResult {
  readonly filePath: string;
  readonly graph: ReportGraph;
}

/** Drops the experiment-orchestration-only labels a `RunResultBundle` carries, keeping only what `buildReport()` needs. */
function toEvaluatedRunRecord(bundle: RunResultBundle): EvaluatedRunRecord {
  return {
    run: bundle.run,
    trace: bundle.trace,
    outcome: bundle.outcome,
    verifications: bundle.verifications,
    evidence: bundle.evidence,
    metrics: bundle.metrics,
    contextArtifact: bundle.contextArtifact,
  };
}

/**
 * Phase 9 entry point: reads one comparison run's raw dumped bundles back
 * (`resultsWriter.ts`, the same source `analyzeComparisonResults.ts` reads), builds the canonical
 * `ReportGraph` (`src/reporting/buildReport.ts`), and persists it to `reports/<experimentId>/
 * report.json` — the artifact meant for actual citation/consumption, replacing the raw
 * `experiment-results/` dump as the thing anyone should read or rely on. Mirrors
 * `analyzeComparisonResults.ts`'s shape exactly (read bundles, adapt to a decoupled record type,
 * call the pure builder) but produces a persisted, schema-validated artifact instead of a
 * console-printed analysis.
 */
export async function generateReport(
  experimentId?: ExperimentId,
  options: GenerateReportOptions = {},
): Promise<GenerateReportResult> {
  const resultsDir = options.resultsDir ?? defaultResultsDir();
  const id = experimentId ?? (await latestExperimentId(resultsDir));
  const bundles = await readAllRunResults(id, resultsDir);
  if (bundles.length === 0) {
    throw new Error(`No run results found for experiment ${id} under ${resultsDir}`);
  }

  const records = bundles.map(toEvaluatedRunRecord);
  const graph = buildReport(records, id, {
    title: options.title ?? `Comparison report — experiment ${id}`,
    limitations: options.limitations,
  });
  const filePath = await writeReport(graph, options.reportsDir ?? defaultReportsDir());

  return { filePath, graph };
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const experimentIdArg = process.argv[2] as ExperimentId | undefined;
  generateReport(experimentIdArg)
    .then(({ filePath, graph }) => {
      console.log(
        `Wrote report for experiment ${graph.report.experimentId} (${String(graph.evaluations.length)} evaluations) to ${filePath}`,
      );
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
