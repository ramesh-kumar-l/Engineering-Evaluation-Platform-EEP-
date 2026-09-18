import type { RunStatus } from '../domain/common/status.js';
import type { ReportGraph } from '../reporting/reportGraph.js';

export type OutcomeStatusCounts = Partial<Record<RunStatus, number>>;

/**
 * Tallies outcome statuses across a report graph — the overview panel's headline breakdown, and
 * the simplest possible drill-down starting point ("how many runs actually succeeded?") before a
 * reader clicks into any individual evaluation.
 */
export function outcomeStatusCounts(graph: ReportGraph): OutcomeStatusCounts {
  const counts: OutcomeStatusCounts = {};
  for (const outcome of graph.outcomes) {
    counts[outcome.status] = (counts[outcome.status] ?? 0) + 1;
  }
  return counts;
}
