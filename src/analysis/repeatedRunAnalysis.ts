import {
  meanConfidenceInterval,
  proportionConfidenceInterval,
  type ConfidenceInterval,
} from './confidenceInterval.js';
import { cohensD, cohensH, type EffectSizeResult } from './effectSize.js';
import { extractMetricValues, metricKindFor, type RunAnalysisRecord } from './analysisInput.js';
import { mean, median, sampleStdDev } from './stats.js';
import type { ConfidenceLevel } from './tDistribution.js';
import type { MetricName } from '../domain/metric/metric.schema.js';

/** Minimum repeated runs a group needs before a confidence interval is estimable — see stats.ts. */
const MIN_SAMPLE_SIZE_FOR_INTERVAL = 2;

export type GroupStatisticalSummary =
  | {
      readonly status: 'ok';
      readonly conditionName: string;
      readonly metricName: MetricName;
      readonly n: number;
      readonly mean: number;
      readonly median: number;
      readonly stdDev: number;
      readonly confidenceInterval: ConfidenceInterval;
    }
  | {
      readonly status: 'insufficient-data';
      readonly conditionName: string;
      readonly metricName: MetricName;
      readonly n: number;
      readonly reason: string;
    };

function successCount(values: readonly number[]): number {
  return values.filter((v) => v === 1).length;
}

/**
 * Summarizes one metric for one condition's repeated runs: n, mean/median/stddev, and a
 * confidence interval (Wilson for `task-success`, Student's t for everything else — see
 * analysisInput.ts's `metricKindFor`). Returns an explicit `insufficient-data` result rather than
 * fabricating an interval when there are too few runs — the same "throw/flag rather than silently
 * report a false number" discipline as ADR-008/ADR-009.
 */
export function summarizeGroup(
  records: readonly RunAnalysisRecord[],
  conditionName: string,
  metricName: MetricName,
  level: ConfidenceLevel,
): GroupStatisticalSummary {
  const conditionRecords = records.filter((r) => r.conditionName === conditionName);
  const values = extractMetricValues(conditionRecords, metricName);
  const kind = metricKindFor(metricName);

  if (kind === 'proportion') {
    if (values.length < 1) {
      return { status: 'insufficient-data', conditionName, metricName, n: values.length, reason: 'no runs' };
    }
    return {
      status: 'ok',
      conditionName,
      metricName,
      n: values.length,
      mean: mean(values),
      median: median(values),
      stdDev: values.length >= 2 ? sampleStdDev(values) : 0,
      confidenceInterval: proportionConfidenceInterval(successCount(values), values.length, level),
    };
  }

  if (values.length < MIN_SAMPLE_SIZE_FOR_INTERVAL) {
    return {
      status: 'insufficient-data',
      conditionName,
      metricName,
      n: values.length,
      reason: `need at least ${String(MIN_SAMPLE_SIZE_FOR_INTERVAL)} runs to estimate a confidence interval, got ${String(values.length)}`,
    };
  }
  return {
    status: 'ok',
    conditionName,
    metricName,
    n: values.length,
    mean: mean(values),
    median: median(values),
    stdDev: sampleStdDev(values),
    confidenceInterval: meanConfidenceInterval(values, level),
  };
}

export type GroupComparison =
  | {
      readonly status: 'ok';
      readonly metricName: MetricName;
      readonly baselineCondition: string;
      readonly treatmentCondition: string;
      readonly baselineSummary: Extract<GroupStatisticalSummary, { status: 'ok' }>;
      readonly treatmentSummary: Extract<GroupStatisticalSummary, { status: 'ok' }>;
      readonly meanDifference: number;
      readonly effectSize: EffectSizeResult;
    }
  | {
      readonly status: 'insufficient-data';
      readonly metricName: MetricName;
      readonly baselineCondition: string;
      readonly treatmentCondition: string;
      readonly reason: string;
    };

/**
 * Compares one metric between two conditions' repeated runs (baseline vs. treatment — the caller
 * decides which is which; this function never labels one "better", since direction-of-improvement
 * is metric-specific — see project-memory-bank/08-metrics.md §Anti-goal). Returns
 * `insufficient-data` rather than a comparison built on too few runs on either side.
 */
export function compareConditions(
  records: readonly RunAnalysisRecord[],
  baselineCondition: string,
  treatmentCondition: string,
  metricName: MetricName,
  level: ConfidenceLevel,
): GroupComparison {
  const baselineSummary = summarizeGroup(records, baselineCondition, metricName, level);
  const treatmentSummary = summarizeGroup(records, treatmentCondition, metricName, level);

  if (baselineSummary.status === 'insufficient-data' || treatmentSummary.status === 'insufficient-data') {
    const reason =
      baselineSummary.status === 'insufficient-data'
        ? `baseline (${baselineCondition}): ${baselineSummary.reason}`
        : `treatment (${treatmentCondition}): ${(treatmentSummary as { reason: string }).reason}`;
    return { status: 'insufficient-data', metricName, baselineCondition, treatmentCondition, reason };
  }

  const kind = metricKindFor(metricName);
  const effectSize =
    kind === 'proportion'
      ? cohensH(
          { successes: successCount(extractMetricValues(records.filter((r) => r.conditionName === baselineCondition), metricName)), trials: baselineSummary.n },
          { successes: successCount(extractMetricValues(records.filter((r) => r.conditionName === treatmentCondition), metricName)), trials: treatmentSummary.n },
        )
      : cohensD(
          extractMetricValues(records.filter((r) => r.conditionName === baselineCondition), metricName),
          extractMetricValues(records.filter((r) => r.conditionName === treatmentCondition), metricName),
        );

  return {
    status: 'ok',
    metricName,
    baselineCondition,
    treatmentCondition,
    baselineSummary,
    treatmentSummary,
    meanDifference: treatmentSummary.mean - baselineSummary.mean,
    effectSize,
  };
}
