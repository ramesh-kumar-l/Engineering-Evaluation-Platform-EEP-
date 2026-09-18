import { traceEvaluation } from '../reporting/traceEvaluation.js';
import type { ReportGraph } from '../reporting/reportGraph.js';
import { htmlEscape } from './htmlEscape.js';
import { renderEvaluationDetail } from './renderEvaluationDetail.js';
import { renderOverview } from './renderOverview.js';

const PAGE_STYLE = `
body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
h1, h2, h3, h4 { color: #111; }
table { border-collapse: collapse; margin: 0.5rem 0 1rem; width: 100%; max-width: 60rem; }
th, td { border: 1px solid #ccc; padding: 0.3rem 0.6rem; text-align: left; font-size: 0.9rem; }
dl.meta { display: grid; grid-template-columns: max-content 1fr; gap: 0.2rem 1rem; max-width: 40rem; }
dl.meta dt { font-weight: 600; }
.muted { color: #777; font-style: italic; }
.evaluation { border-top: 2px solid #ddd; padding-top: 1rem; margin-top: 1.5rem; }
.status { padding: 0.1rem 0.5rem; border-radius: 0.3rem; font-size: 0.75rem; font-weight: 600; }
.status-SUCCESS { background: #d4edda; color: #155724; }
.status-TASK_FAILURE, .status-AGENT_FAILURE, .status-EVALUATION_FAILURE { background: #f8d7da; color: #721c24; }
.status-ENVIRONMENT_FAILURE, .status-TIMEOUT, .status-INCOMPLETE { background: #fff3cd; color: #856404; }
`;

/**
 * Renders one experiment's `ReportGraph` into a single, self-contained, offline-readable HTML
 * page — the Phase 10 MVP dashboard. No external stylesheet/script/CDN reference: everything a
 * viewer needs is inlined in this one file, matching project-memory-bank/11-security.md ("no
 * source code/data leaves the local machine") and 04-architecture.md's local-first mandate (no
 * server process required to view a report).
 */
export function renderDashboardPage(graph: ReportGraph): string {
  const evaluationSections = graph.report.evaluationIds
    .map((evaluationId) => renderEvaluationDetail(traceEvaluation(graph, evaluationId)))
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${htmlEscape(graph.report.title)}</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
${renderOverview(graph)}
<h2>Evaluations</h2>
${evaluationSections}
</body>
</html>`;
}
