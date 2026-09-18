import type { EvaluationTrace } from '../reporting/traceEvaluation.js';
import { htmlEscape } from './htmlEscape.js';

/**
 * Renders one Evaluation's full drill-down chain (run → outcome → metrics → verifications →
 * evidence) as a self-contained HTML section — the concrete UI for
 * project-memory-bank/12-dashboard-strategy.md's "No black-box KPI" principle: every value shown
 * on the overview traces back to the exact records that produced it, all inline, nothing fetched
 * live.
 */
export function renderEvaluationDetail(trace: EvaluationTrace): string {
  const { evaluation, run, outcome, metrics, verifications, evidence } = trace;

  const metricRows = metrics
    .map(
      (metric) =>
        `<tr><td>${htmlEscape(metric.name)}</td><td>${String(metric.value)}</td><td>${htmlEscape(metric.unit ?? '')}</td></tr>`,
    )
    .join('');

  const verificationRows = verifications
    .map(
      (verification) =>
        `<tr><td>${htmlEscape(verification.method)}</td><td>${verification.passed ? 'pass' : 'fail'}</td><td>${htmlEscape(verification.detail ?? '')}</td></tr>`,
    )
    .join('');

  const evidenceItems = evidence
    .map((item) => {
      const body = item.redacted ? '<em>[redacted]</em>' : htmlEscape(item.content ?? '(no content recorded)');
      return `<li><strong>${htmlEscape(item.kind)}</strong> — ${htmlEscape(item.description)} <span class="muted">(${htmlEscape(item.source)})</span><br />${body}</li>`;
    })
    .join('');

  return `
<section class="evaluation" id="evaluation-${htmlEscape(evaluation.id)}">
  <h3>${htmlEscape(evaluation.id)} <span class="status status-${htmlEscape(outcome.status)}">${htmlEscape(outcome.status)}</span></h3>
  <dl class="meta">
    <dt>Run</dt><dd>${htmlEscape(run.id)}</dd>
    <dt>Task</dt><dd>${htmlEscape(run.taskId)}</dd>
    <dt>Condition</dt><dd>${htmlEscape(run.conditionId)}</dd>
    <dt>Agent</dt><dd>${htmlEscape(run.metadata.agentName)} ${htmlEscape(run.metadata.agentVersion)}</dd>
    <dt>Model</dt><dd>${htmlEscape(run.metadata.modelName ?? 'n/a')} ${htmlEscape(run.metadata.modelVersion ?? '')}</dd>
    <dt>Context provider</dt><dd>${htmlEscape(run.metadata.contextProviderName)} ${htmlEscape(run.metadata.contextProviderVersion)}</dd>
    <dt>Started</dt><dd>${htmlEscape(run.startedAt)}</dd>
    <dt>Finished</dt><dd>${htmlEscape(run.finishedAt ?? 'n/a')}</dd>
  </dl>
  <p class="summary">${htmlEscape(outcome.summary)}</p>

  <h4>Metrics</h4>
  <table><thead><tr><th>Name</th><th>Value</th><th>Unit</th></tr></thead><tbody>${metricRows || '<tr><td colspan="3" class="muted">None recorded</td></tr>'}</tbody></table>

  <h4>Verifications</h4>
  <table><thead><tr><th>Method</th><th>Result</th><th>Detail</th></tr></thead><tbody>${verificationRows || '<tr><td colspan="3" class="muted">None recorded</td></tr>'}</tbody></table>

  <h4>Evidence</h4>
  <ul>${evidenceItems || '<li class="muted">None recorded</li>'}</ul>
</section>`;
}
