import { analyzeRepeatedRuns, type RepeatedRunAnalysisReport } from './groupedAnalysis.js';
import type { RunAnalysisRecord } from './analysisInput.js';
import type { MetricName } from '../domain/metric/metric.schema.js';
import type { ConfidenceLevel } from './tDistribution.js';

/** One component's full-vs-ablated statistical picture, reusing Phase 7's analysis unchanged. */
export interface ComponentContribution {
  readonly component: string;
  readonly fullConditionName: string;
  readonly ablatedConditionName: string;
  readonly analysis: RepeatedRunAnalysisReport;
}

export interface ComponentContributionOptions {
  readonly fullConditionName: string;
  /**
   * Maps a component label (e.g. `"history"`) to the condition name its ablated runs used (e.g.
   * `"ecc-ablated:history"`, see eccAblation.ts's `ablatedConditionName()`). Caller-supplied so
   * src/analysis/ stays decoupled from any specific provider's naming convention — the same
   * one-way-dependency discipline analysisInput.ts already established for `RunAnalysisRecord`.
   */
  readonly ablatedConditionsByComponent: Readonly<Record<string, string>>;
  readonly metricNames: readonly MetricName[];
  readonly level: ConfidenceLevel;
}

/**
 * The Phase 8 (Ablation) entry point: per-component measurement of a context provider's
 * contribution — project-memory-bank/13-roadmap.md's Phase 8 row and this phase's exit criterion.
 * For each component, filters to just its full-vs-ablated pair and calls `analyzeRepeatedRuns()`
 * (Phase 7, unchanged) so every discipline it already enforces — exact-table confidence
 * intervals, Cohen's d/h effect sizes, category/complexity breakdown, explicit
 * `insufficient-data` results, never labeling a condition "better" — applies here without
 * duplication. Not every component is assumed to add value; a negligible or near-zero effect
 * size is as valid a result as a large one (project-memory-bank/06-evaluation-methodology.md
 * §Ablation discipline).
 */
export function analyzeComponentContributions(
  records: readonly RunAnalysisRecord[],
  options: ComponentContributionOptions,
): readonly ComponentContribution[] {
  const { fullConditionName, ablatedConditionsByComponent, metricNames, level } = options;

  return Object.entries(ablatedConditionsByComponent).map(([component, ablated]) => {
    const relevantRecords = records.filter(
      (r) => r.conditionName === fullConditionName || r.conditionName === ablated,
    );
    return {
      component,
      fullConditionName,
      ablatedConditionName: ablated,
      analysis: analyzeRepeatedRuns(relevantRecords, {
        metricNames,
        baselineCondition: fullConditionName,
        level,
      }),
    };
  });
}
