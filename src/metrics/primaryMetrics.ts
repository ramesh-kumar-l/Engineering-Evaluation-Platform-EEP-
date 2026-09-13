import { estimateTokenCount } from './estimateTokens.js';
import { buildMetric, durationMs } from './metricHelpers.js';
import type { RunMetricsInput } from './metricsInput.js';
import type { Metric } from '../domain/metric/metric.schema.js';

function resolveContextTokens(contextArtifact: RunMetricsInput['contextArtifact']): number {
  if (!contextArtifact) return 0;
  return contextArtifact.tokenCount ?? estimateTokenCount(contextArtifact.content);
}

/**
 * The five primary metrics from project-memory-bank/08-metrics.md, computed per run. Each is a
 * best-available, honestly-scoped proxy given what Phase 4 currently produces — documented
 * in-line where a metric is not yet the full definition from the memory bank, so gaps are
 * traceable rather than silently approximated forever. See [[phases/phase-05]].
 */
export function computePrimaryMetrics(input: RunMetricsInput): Metric[] {
  const { run, trace, outcome, verifications, contextArtifact } = input;
  const runId = run.id;

  const taskSuccess = outcome.status === 'SUCCESS' ? 1 : 0;

  // Proxy for "Engineering Quality" until static-analysis/security-check/architecture-check
  // verifiers exist (project-memory-bank/20-next-actions.md backlog): the fraction of executed
  // checks that passed, so a partially-correct run (e.g. tests pass but diff-analysis fails)
  // scores between 0 and 1 rather than collapsing to the same 0 as a run with no evidence at all.
  const engineeringQuality =
    verifications.length > 0 ? verifications.filter((v) => v.passed).length / verifications.length : 0;

  const endedAt = run.finishedAt ?? trace.endedAt ?? trace.startedAt;
  const timeToCorrectOutcome = durationMs(run.startedAt, endedAt);

  // "Useful decision-relevant context" has no ground truth yet (evidence-recall/precision are
  // not computable this phase — see secondaryMetrics.ts); until then, usefulness is approximated
  // by whether the run actually succeeded. Expressed per 1000 tokens so the value stays a
  // readable, comparable scale across runs of very different context sizes.
  const contextTokens = resolveContextTokens(contextArtifact);
  const contextEfficiency = contextTokens > 0 ? (taskSuccess * 1000) / contextTokens : 0;

  // No human-in-the-loop mechanism exists yet — every run today is fully autonomous, so this is
  // always 0 until a Condition/agent that can request human input is introduced (Phase 6+).
  const humanIntervention = 0;

  return [
    buildMetric(runId, 'task-success', taskSuccess),
    buildMetric(runId, 'engineering-quality', engineeringQuality),
    buildMetric(runId, 'time-to-correct-outcome', timeToCorrectOutcome, 'ms'),
    buildMetric(runId, 'context-efficiency', contextEfficiency, 'success-per-1000-tokens'),
    buildMetric(runId, 'human-intervention', humanIntervention),
  ];
}
