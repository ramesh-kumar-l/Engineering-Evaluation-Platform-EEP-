import { estimateTokenCount } from './estimateTokens.js';
import { buildMetric } from './metricHelpers.js';
import type { RunMetricsInput } from './metricsInput.js';
import type { Metric } from '../domain/metric/metric.schema.js';

const CHANGE_ACTION_TYPES = new Set(['file-edit', 'file-create', 'file-delete']);

function countDistinctTargets(actions: RunMetricsInput['trace']['actions'], types: Set<string>): number {
  const targets = new Set<string>();
  for (const action of actions) {
    if (types.has(action.type) && action.target) targets.add(action.target);
  }
  return targets.size;
}

/**
 * Secondary metrics from project-memory-bank/08-metrics.md that are honestly computable from
 * data Phase 4 already produces. Deliberately NOT included: `evidence-recall`, `evidence-
 * precision`, `evidence-authority`, `evidence-freshness`, and `context-redundancy` (no ground-
 * truth "required evidence" or authority/freshness model exists yet — that needs curated context
 * from Phase 6's ECC integration); `regression-rate` (needs cross-run history — Phase 7);
 * `risk-classification` and `decision-confidence` (no risk field on Task, no confidence field on
 * Decision — would require fabricating a value). Adding real computation for any of these is a
 * schema/data-source change, not a metrics-layer change — see [[phases/phase-05]].
 */
export function computeSecondaryMetrics(input: RunMetricsInput): Metric[] {
  const { run, trace, verifications, contextArtifact, executionErrors } = input;
  const runId = run.id;

  const contextTokens = contextArtifact
    ? (contextArtifact.tokenCount ?? estimateTokenCount(contextArtifact.content))
    : 0;

  const filesRead = countDistinctTargets(trace.actions, new Set(['file-read']));
  const filesChanged = countDistinctTargets(trace.actions, CHANGE_ACTION_TYPES);

  const failedAttempts = verifications.filter((v) => !v.passed).length;

  const verificationsWithEvidence = verifications.filter((v) => v.evidenceIds.length > 0).length;
  const provenanceCompleteness =
    verifications.length > 0 ? verificationsWithEvidence / verifications.length : 0;

  const totalVerifiersAttempted = verifications.length + executionErrors.length;
  const verificationCompleteness =
    totalVerifiersAttempted > 0 ? verifications.length / totalVerifiersAttempted : 0;

  return [
    buildMetric(runId, 'context-tokens', contextTokens, 'tokens'),
    buildMetric(runId, 'tool-calls', trace.actions.length),
    buildMetric(runId, 'agent-turns', trace.decisions.length),
    buildMetric(runId, 'files-read', filesRead),
    buildMetric(runId, 'files-changed', filesChanged),
    buildMetric(runId, 'retries', trace.retries),
    buildMetric(runId, 'failed-attempts', failedAttempts),
    buildMetric(runId, 'provenance-completeness', provenanceCompleteness),
    buildMetric(runId, 'verification-completeness', verificationCompleteness),
  ];
}
