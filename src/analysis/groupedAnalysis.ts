import { compareConditions, summarizeGroup, type GroupComparison, type GroupStatisticalSummary } from './repeatedRunAnalysis.js';
import { groupBy } from './groupBy.js';
import type { RunAnalysisRecord } from './analysisInput.js';
import type { MetricName } from '../domain/metric/metric.schema.js';
import type { ConfidenceLevel } from './tDistribution.js';

/** One metric's statistical picture for one slice of the data (an entire dataset, one category, or one complexity level). */
export interface DimensionAnalysis {
  readonly dimension: 'overall' | 'category' | 'complexity';
  /** The category/complexity value, or `'overall'` when `dimension` is `'overall'`. */
  readonly dimensionValue: string;
  readonly metricName: MetricName;
  readonly summariesByCondition: readonly GroupStatisticalSummary[];
  /** One comparison per non-baseline condition present in this slice, baseline vs. that condition. */
  readonly comparisons: readonly GroupComparison[];
}

export interface RepeatedRunAnalysisReport {
  readonly level: ConfidenceLevel;
  readonly baselineCondition: string;
  readonly conditionsObserved: readonly string[];
  readonly overall: readonly DimensionAnalysis[];
  readonly byCategory: readonly DimensionAnalysis[];
  readonly byComplexity: readonly DimensionAnalysis[];
}

export interface AnalyzeRepeatedRunsOptions {
  readonly metricNames: readonly MetricName[];
  readonly baselineCondition: string;
  readonly level: ConfidenceLevel;
}

function analyzeSlice(
  records: readonly RunAnalysisRecord[],
  dimension: DimensionAnalysis['dimension'],
  dimensionValue: string,
  metricName: MetricName,
  baselineCondition: string,
  treatmentConditions: readonly string[],
  level: ConfidenceLevel,
): DimensionAnalysis {
  const conditionsHere = [...new Set(records.map((r) => r.conditionName))];
  const summariesByCondition = conditionsHere.map((c) => summarizeGroup(records, c, metricName, level));
  const comparisons = treatmentConditions
    .filter((t) => conditionsHere.includes(t))
    .map((t) => compareConditions(records, baselineCondition, t, metricName, level));

  return { dimension, dimensionValue, metricName, summariesByCondition, comparisons };
}

/**
 * The Phase 7 entry point: repeated-run statistical analysis (confidence intervals, effect size)
 * across categories and complexity levels — project-memory-bank/13-roadmap.md's Phase 7 row and
 * this phase's user-specified exit criterion. Never declares a condition "better" — it reports
 * intervals, differences, and standardized effect sizes; interpretation (including which
 * direction is an improvement for a given metric) is left to a human reader or a later reporting
 * layer, per project-memory-bank/08-metrics.md §Anti-goal.
 */
export function analyzeRepeatedRuns(
  records: readonly RunAnalysisRecord[],
  options: AnalyzeRepeatedRunsOptions,
): RepeatedRunAnalysisReport {
  const { metricNames, baselineCondition, level } = options;
  const conditionsObserved = [...new Set(records.map((r) => r.conditionName))];
  const treatmentConditions = conditionsObserved.filter((c) => c !== baselineCondition);

  const overall = metricNames.map((metricName) =>
    analyzeSlice(records, 'overall', 'overall', metricName, baselineCondition, treatmentConditions, level),
  );

  const byCategoryGroups = groupBy(records, (r) => r.taskCategory);
  const byCategory = [...byCategoryGroups.entries()].flatMap(([category, categoryRecords]) =>
    metricNames.map((metricName) =>
      analyzeSlice(categoryRecords, 'category', category, metricName, baselineCondition, treatmentConditions, level),
    ),
  );

  const byComplexityGroups = groupBy(records, (r) => r.taskComplexity);
  const byComplexity = [...byComplexityGroups.entries()].flatMap(([complexity, complexityRecords]) =>
    metricNames.map((metricName) =>
      analyzeSlice(complexityRecords, 'complexity', complexity, metricName, baselineCondition, treatmentConditions, level),
    ),
  );

  return { level, baselineCondition, conditionsObserved, overall, byCategory, byComplexity };
}
