import type { ReportGraph } from '../reporting/reportGraph.js';
import { htmlEscape } from './htmlEscape.js';
import { outcomeStatusCounts } from './outcomeStatusCounts.js';

/**
 * Renders the dashboard's overview panel: report identity, generation time, required
 * limitations (project-memory-bank/06-evaluation-methodology.md §Statistical discipline mandates
 * these be stated, never omitted), and a headline outcome-status breakdown.
 */
export function renderOverview(graph: ReportGraph): string {
  const { report } = graph;
  const counts = outcomeStatusCounts(graph);
  const statusRows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `<tr><td>${htmlEscape(status)}</td><td>${String(count)}</td></tr>`)
    .join('');

  const limitationsList =
    report.limitations.length > 0
      ? `<ul>${report.limitations.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>`
      : '<p class="muted">No limitations recorded.</p>';

  return `
<section id="overview">
  <h1>${htmlEscape(report.title)}</h1>
  <dl class="meta">
    <dt>Experiment</dt><dd>${htmlEscape(report.experimentId)}</dd>
    <dt>Report ID</dt><dd>${htmlEscape(report.id)}</dd>
    <dt>Generated</dt><dd>${htmlEscape(report.generatedAt)}</dd>
    <dt>Evaluations</dt><dd>${String(graph.evaluations.length)}</dd>
  </dl>
  <h2>Outcome status breakdown</h2>
  <table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${statusRows}</tbody></table>
  <h2>Limitations</h2>
  ${limitationsList}
</section>`;
}
