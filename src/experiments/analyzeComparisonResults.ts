import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RunAnalysisRecord } from '../analysis/analysisInput.js';
import { analyzeComponentContributions, type ComponentContribution } from '../analysis/componentContribution.js';
import { analyzeRepeatedRuns, type RepeatedRunAnalysisReport } from '../analysis/groupedAnalysis.js';
import type { ConfidenceLevel } from '../analysis/tDistribution.js';
import type { ExperimentId } from '../domain/common/ids.js';
import { PRIMARY_METRIC_NAMES, type MetricName } from '../domain/metric/metric.schema.js';
import { ablatedConditionName, ECC_ABLATION_COMPONENTS } from '../harness/providers/eccAblation.js';
import { defaultResultsDir, readAllRunResults } from './resultsWriter.js';

const DEFAULT_CONFIDENCE_LEVEL: ConfidenceLevel = 0.95;
const BASELINE_CONDITION_NAME = 'native';
const FULL_ECC_CONDITION_NAME = 'ecc';

export interface ComparisonAnalysisResult {
  readonly experimentId: ExperimentId;
  readonly runCount: number;
  readonly repeatedRunReport: RepeatedRunAnalysisReport;
  readonly componentReports: readonly ComponentContribution[];
}

/** Finds the most recently written experiment subdirectory under `resultsDir`, for when no `experimentId` is given. */
async function latestExperimentId(resultsDir: string): Promise<ExperimentId> {
  const entries = await readdir(resultsDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((entry) => entry.isDirectory());
  if (dirs.length === 0) {
    throw new Error(`No experiment results found under ${resultsDir}`);
  }
  const withMtime = await Promise.all(
    dirs.map(async (entry) => ({
      name: entry.name,
      mtimeMs: (await stat(join(resultsDir, entry.name))).mtimeMs,
    })),
  );
  withMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return withMtime[0]!.name as ExperimentId;
}

/**
 * Phase 6-remainder analysis entry point: reads one comparison run's raw dumped bundles back
 * (`resultsWriter.ts`) and runs Phase 7's `analyzeRepeatedRuns()` and Phase 8's
 * `analyzeComponentContributions()` unchanged against them — the first time either runs against
 * real, not synthetic, data. Both underlying functions are reused exactly as-is: no bespoke
 * statistics live here, only assembling `RunAnalysisRecord[]` from the dumped bundles.
 */
export async function analyzeComparisonResults(
  experimentId?: ExperimentId,
  resultsDir: string = defaultResultsDir(),
  metricNames: readonly MetricName[] = PRIMARY_METRIC_NAMES,
  level: ConfidenceLevel = DEFAULT_CONFIDENCE_LEVEL,
): Promise<ComparisonAnalysisResult> {
  const id = experimentId ?? (await latestExperimentId(resultsDir));
  const bundles = await readAllRunResults(id, resultsDir);
  if (bundles.length === 0) {
    throw new Error(`No run results found for experiment ${id} under ${resultsDir}`);
  }

  const records: RunAnalysisRecord[] = bundles.map((bundle) => ({
    runId: bundle.run.id,
    conditionName: bundle.conditionName,
    taskCategory: bundle.taskCategory,
    taskComplexity: bundle.taskComplexity,
    metrics: bundle.metrics,
  }));

  const repeatedRunReport = analyzeRepeatedRuns(records, {
    metricNames,
    baselineCondition: BASELINE_CONDITION_NAME,
    level,
  });

  const ablatedConditionsByComponent = Object.fromEntries(
    ECC_ABLATION_COMPONENTS.map((component) => [component, ablatedConditionName(component)]),
  );
  const componentReports = analyzeComponentContributions(records, {
    fullConditionName: FULL_ECC_CONDITION_NAME,
    ablatedConditionsByComponent,
    metricNames,
    level,
  });

  return { experimentId: id, runCount: bundles.length, repeatedRunReport, componentReports };
}

function printComparisonAnalysisResult(result: ComparisonAnalysisResult): void {
  console.log(`\n=== Comparison analysis: experiment ${result.experimentId} (${String(result.runCount)} runs) ===`);

  console.log(`\n--- Repeated-run analysis (baseline: ${BASELINE_CONDITION_NAME}) ---`);
  for (const slice of result.repeatedRunReport.overall) {
    console.log(`\nMetric: ${slice.metricName} (overall)`);
    for (const summary of slice.summariesByCondition) {
      console.log(
        summary.status === 'ok'
          ? `  ${summary.conditionName}: n=${String(summary.n)} mean=${summary.mean.toFixed(3)} CI=[${summary.confidenceInterval.lower.toFixed(3)}, ${summary.confidenceInterval.upper.toFixed(3)}]`
          : `  ${summary.conditionName}: insufficient data (${summary.reason})`,
      );
    }
    for (const comparison of slice.comparisons) {
      console.log(
        comparison.status === 'ok'
          ? `  ${comparison.baselineCondition} vs ${comparison.treatmentCondition}: meanDiff=${comparison.meanDifference.toFixed(3)} effectSize=${comparison.effectSize.value.toFixed(3)} (${comparison.effectSize.magnitude})`
          : `  ${comparison.baselineCondition} vs ${comparison.treatmentCondition}: insufficient data (${comparison.reason})`,
      );
    }
  }

  console.log(`\n--- Component ablation analysis (full: ${FULL_ECC_CONDITION_NAME}) ---`);
  for (const contribution of result.componentReports) {
    console.log(`\nComponent: ${contribution.component}`);
    for (const slice of contribution.analysis.overall) {
      for (const comparison of slice.comparisons) {
        console.log(
          comparison.status === 'ok'
            ? `  ${slice.metricName}: meanDiff=${comparison.meanDifference.toFixed(3)} effectSize=${comparison.effectSize.value.toFixed(3)} (${comparison.effectSize.magnitude})`
            : `  ${slice.metricName}: insufficient data (${comparison.reason})`,
        );
      }
    }
  }
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const experimentIdArg = process.argv[2] as ExperimentId | undefined;
  analyzeComparisonResults(experimentIdArg)
    .then(printComparisonAnalysisResult)
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
