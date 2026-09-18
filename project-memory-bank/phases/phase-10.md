# Phase 10 — Dashboard Feasibility / MVP

## Objective

Per this round's user-specified exit criterion: a feasibility spike, then an MVP dashboard
reading from Phase 9's `Report` format ([[13-roadmap]]'s Phase 10 row, "Only after the data layer
stabilizes"; [[12-dashboard-strategy]]).

## Feasibility spike

Three rendering/serving mechanisms were considered: a client-side SPA, a long-running local
dynamic server (e.g. Express), and a static server-rendered HTML generator. The static generator
was chosen — zero new npm dependencies, no running process, directly satisfies "reads from Phase
9's Report format," and matches [[04-architecture]]'s local-first mandate ("No database... until
a real requirement demonstrates the need... results are files on disk"). Full reasoning in
ADR-015 in [[14-decisions]].

## Implemented

New `src/dashboard/` module (all files under 300 lines, largest 59) — a pure layer depending only
on `src/domain/` and `src/reporting/`, the same one-way-dependency discipline ADR-011/ADR-014
established:

- **`htmlEscape.ts`** (17 lines) — escapes the five reserved HTML characters before any
  report-sourced string (title, summary, evidence content, etc.) is embedded in generated markup.
- **`outcomeStatusCounts.ts`** (17 lines) — tallies `Outcome.status` across a `ReportGraph`, the
  overview panel's headline breakdown.
- **`renderOverview.ts`** (37 lines) — renders report identity, generated timestamp, the required
  `limitations` list, and the status breakdown.
- **`renderEvaluationDetail.ts`** (59 lines) — renders one `EvaluationTrace` (from
  `src/reporting/traceEvaluation.ts`, reused unchanged) as a drill-down section: run metadata
  (agent, model, context provider, timestamps), outcome summary, metrics/verifications tables,
  and an evidence list honoring `Evidence.redacted`.
- **`renderDashboardPage.ts`** (47 lines) — wraps the overview plus one section per evaluation
  into a single self-contained HTML document with inline `<style>`, no external resource
  references at all.
- **`dashboardWriter.ts`** (22 lines) — `writeDashboard()`/`defaultDashboardDir()`, persisting the
  rendered page to `dashboard/<experimentId>/index.html`.

`src/experiments/generateDashboard.ts` (45 lines, new) is the orchestration entry point —
parallel to `generateReport.ts`: reads a persisted `ReportGraph` via
`src/reporting/reportWriter.ts`'s `readReport()`, defaulting to the most recently written report
via a new `latestReportedExperimentId()` helper added to that same file (mirrors
`resultsWriter.ts`'s `latestExperimentId()`). New `npm run dashboard:generate` script.

## Tests

15 new tests across 8 new/edited test files (299 total across 79 files, up from 284/71):
`htmlEscape.test.ts`, `outcomeStatusCounts.test.ts`, `renderOverview.test.ts` (title/limitations
escaping, status breakdown, placeholder when no limitations), `renderEvaluationDetail.test.ts`
(full detail rendering, redaction hides `Evidence.content`), `renderDashboardPage.test.ts` (one
self-contained document, no external URLs, one section per evaluation), `dashboardWriter.test.ts`
(round-trip write), `src/experiments/generateDashboard.test.ts` (explicit experiment id, and
latest-report resolution when none is given), and 2 new tests in `reportWriter.test.ts` for
`latestReportedExperimentId()`.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 298/299 tests passing (the one
  failure, `eccCliInvoker.test.ts`'s subprocess-spawn timing test, is pre-existing flakiness under
  parallel worker load, confirmed passing in isolation, unrelated to this phase's files).
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new source file is `renderEvaluationDetail.ts` at 59
  lines, `generateDashboard.ts` at 45 — both comfortably under the 300-line ceiling.
- `git status --short` reviewed; caught and fixed an unanchored `dashboard/` `.gitignore` pattern
  that was also matching the new `src/dashboard/` source directory (all three output-directory
  entries now anchored with a leading `/`).

## Decisions made

ADR-015 in [[14-decisions]]: static, self-contained HTML dashboard generator chosen over a
client-side SPA or a dynamic local server; `src/dashboard/` kept decoupled from
`src/experiments/`/`harness`/`evaluation`, reading only `src/reporting/`'s `ReportGraph`; every
report-sourced string HTML-escaped before rendering; `Evidence.redacted` honored.

## Explicitly not implemented (by design, later work)

- **Multi-experiment/condition comparison views, complexity/category breakdowns, failure-cluster
  views.** [[12-dashboard-strategy]]'s full target view list includes these; they need Phase 7/8's
  `analyzeComparisonResults.ts` output folded into `ReportGraph` first — already flagged as
  deferred in [[phases/phase-09]], not newly discovered here.
- **Client-side interactivity** (filtering, sorting, search). The MVP is purely static markup.
- **Human-readable Task/Condition names.** `ReportGraph` carries only `taskId`/`conditionId`
  strings, not `Task`/`Condition` entities — the dashboard shows raw ids.
- **A dev server / live-reload.** The generator writes a static file; viewing it means opening it
  in a browser, no `npm run dashboard:serve` equivalent.
- **Running this against real experiment data.** No live comparison run has been executed yet
  (Phase 6's remaining scope) — validated against synthetic `ReportGraph` fixtures in tests, the
  same way Phase 5/7/8/9's functions were validated before real data existed.

## Known limitations

- A `ReportGraph` with a very large number of evaluations would produce one very large HTML file
  (no pagination) — acceptable for the 3-task, 9-condition, 3-repetition scope this round targets
  (at most 81 evaluations); revisit if a future experiment's scale grows materially.
- `renderEvaluationDetail.ts`'s status color classes (`.status-SUCCESS`, `.status-TASK_FAILURE`,
  etc.) are hardcoded against `RUN_STATUSES`' current 7 values — adding a new run status later
  requires a matching CSS rule addition or it silently renders with no color styling (not a
  functional break, purely cosmetic).

## Risks discovered

No new risk-register row was needed — this phase adds a read-only rendering layer over data
Phases 3-9 already produce and validate; it introduces no new operational risk category
[[16-risks]] tracks. The `.gitignore` anchoring bug (caught before commit, see Validation) is
noted here only as a process reminder, not a standing risk.

## Status

Complete (this round's scope: feasibility spike plus a static, single-experiment MVP dashboard
reading Phase 9's `ReportGraph` format). Pending user approval to proceed with a live comparison
run, Phase 11 (Public Benchmark), the remaining Phase 9 roadmap scope (CSV/Markdown/HTML export),
richer dashboard views (multi-experiment comparison, failure analysis), or any other next step.
