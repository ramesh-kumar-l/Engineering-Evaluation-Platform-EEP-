import { proportionConfidenceInterval, type ConfidenceInterval } from './confidenceInterval.js';
import { groupBy } from './groupBy.js';
import type { RunVerificationRecord } from './failureAnalysisInput.js';
import type { ConfidenceLevel } from './tDistribution.js';
import type { VerificationMethod } from '../domain/verification/verification.schema.js';

/** Which slice of the data a `FailureClusterSummary` describes — mirrors `DimensionAnalysis` in groupedAnalysis.ts. */
export type FailureClusterDimension = 'overall' | 'condition' | 'category' | 'complexity';

/**
 * One `verificationMethod`'s failure picture within one slice of the data (all runs, one
 * condition, one task category, or one complexity level). `failureRate`'s Wilson interval uses
 * the same `proportionConfidenceInterval` Phase 7 already uses for `task-success` — a
 * verification either passes or fails, exactly the Bernoulli shape that interval is for.
 */
export interface FailureClusterSummary {
  readonly method: VerificationMethod;
  readonly dimension: FailureClusterDimension;
  readonly dimensionValue: string;
  readonly totalAttempts: number;
  readonly failureCount: number;
  readonly failureRate: number;
  readonly confidenceInterval: ConfidenceInterval;
}

export interface FailureClusterReport {
  readonly level: ConfidenceLevel;
  readonly methodsObserved: readonly VerificationMethod[];
  /** One entry per method actually observed, sorted worst-failure-rate first. */
  readonly overall: readonly FailureClusterSummary[];
  /** One entry per (method, condition) pair actually observed, sorted worst-failure-rate first. */
  readonly byCondition: readonly FailureClusterSummary[];
  /** One entry per (method, category) pair actually observed, sorted worst-failure-rate first. */
  readonly byCategory: readonly FailureClusterSummary[];
  /** One entry per (method, complexity) pair actually observed, sorted worst-failure-rate first. */
  readonly byComplexity: readonly FailureClusterSummary[];
}

export interface FailureClusterOptions {
  readonly level: ConfidenceLevel;
}

interface FlatVerification {
  readonly method: VerificationMethod;
  readonly passed: boolean;
  readonly conditionName: string;
  readonly taskCategory: string;
  readonly taskComplexity: string;
}

function flatten(records: readonly RunVerificationRecord[]): FlatVerification[] {
  return records.flatMap((record) =>
    record.verifications.map((verification) => ({
      method: verification.method,
      passed: verification.passed,
      conditionName: record.conditionName,
      taskCategory: record.taskCategory,
      taskComplexity: record.taskComplexity,
    })),
  );
}

/**
 * Summarizes one method's failures within one already-filtered-to-nonempty slice. `items` is
 * always nonempty by construction (every caller filters by a `method`/`dimensionValue` pair it
 * first confirmed is present), so `proportionConfidenceInterval`'s `trials >= 1` requirement is
 * always satisfied — no `insufficient-data` branch is needed here, unlike `summarizeGroup()`'s
 * metric summaries, where a group can legitimately have zero runs.
 */
function summarizeCluster(
  items: readonly FlatVerification[],
  method: VerificationMethod,
  dimension: FailureClusterDimension,
  dimensionValue: string,
  level: ConfidenceLevel,
): FailureClusterSummary {
  const totalAttempts = items.length;
  const failureCount = items.filter((item) => !item.passed).length;
  return {
    method,
    dimension,
    dimensionValue,
    totalAttempts,
    failureCount,
    failureRate: failureCount / totalAttempts,
    confidenceInterval: proportionConfidenceInterval(failureCount, totalAttempts, level),
  };
}

function clusterByDimension(
  flat: readonly FlatVerification[],
  methods: readonly VerificationMethod[],
  dimension: FailureClusterDimension,
  keyFn: (item: FlatVerification) => string,
  level: ConfidenceLevel,
): FailureClusterSummary[] {
  const groups = groupBy(flat, keyFn);
  return [...groups.entries()].flatMap(([dimensionValue, items]) =>
    methods
      .filter((method) => items.some((item) => item.method === method))
      .map((method) =>
        summarizeCluster(
          items.filter((item) => item.method === method),
          method,
          dimension,
          dimensionValue,
          level,
        ),
      ),
  );
}

function sortWorstFirst(summaries: readonly FailureClusterSummary[]): FailureClusterSummary[] {
  return [...summaries].sort((a, b) => b.failureRate - a.failureRate || b.totalAttempts - a.totalAttempts);
}

/**
 * The Phase 7 roadmap remainder: failure clustering — which `verificationMethod`s fail most
 * often, broken down overall and by condition/category/complexity (project-memory-bank/
 * 13-roadmap.md's Phase 7 row, 4th item). Reuses the same Wilson-interval machinery Phase 7
 * already established for `task-success` (ADR-011's exact-table discipline) rather than inventing
 * new statistics — a verification pass/fail is exactly the Bernoulli shape that interval is built
 * for. Every returned list is sorted worst-failure-rate-first, so the highest-priority cluster to
 * investigate is always first. Never declares *why* a method fails or which condition is "better"
 * — that interpretation is left to a human reader or a later reporting layer, matching
 * project-memory-bank/08-metrics.md §Anti-goal.
 */
export function analyzeFailureClusters(
  records: readonly RunVerificationRecord[],
  options: FailureClusterOptions,
): FailureClusterReport {
  const { level } = options;
  const flat = flatten(records);
  const methodsObserved = [...new Set(flat.map((item) => item.method))].sort();

  const overall = methodsObserved.map((method) =>
    summarizeCluster(
      flat.filter((item) => item.method === method),
      method,
      'overall',
      'overall',
      level,
    ),
  );

  const byCondition = clusterByDimension(flat, methodsObserved, 'condition', (item) => item.conditionName, level);
  const byCategory = clusterByDimension(flat, methodsObserved, 'category', (item) => item.taskCategory, level);
  const byComplexity = clusterByDimension(flat, methodsObserved, 'complexity', (item) => item.taskComplexity, level);

  return {
    level,
    methodsObserved,
    overall: sortWorstFirst(overall),
    byCondition: sortWorstFirst(byCondition),
    byCategory: sortWorstFirst(byCategory),
    byComplexity: sortWorstFirst(byComplexity),
  };
}
