# Phase 9 — Reporting

## Objective

Per this round's user-specified exit criterion (a narrowed scope within [[13-roadmap]]'s Phase 9
row, which lists "JSON, CSV, Markdown, HTML"): a canonical `Report` schema/persistence format —
today's `experiment-results/` is explicitly a throwaway JSON dump, not this. Exit criterion: a
`Report` entity that aggregates Runs→Metrics→Evidence with full traceability, replacing the raw
dump.

## Implemented

New `src/reporting/` module (all files under 300 lines, largest 66) — a pure layer depending only
on `src/domain/`, the same one-way-dependency discipline ADR-011 established for `src/analysis/`:

- **`evaluatedRunInput.ts`** (29 lines) — `EvaluatedRunRecord`, the structural input type (`run`,
  optional `trace`, `outcome`, `verifications`, `evidence`, `metrics`, optional `contextArtifact`)
  decoupled from `src/experiments/`'s `RunResultBundle`, matching `analysisInput.ts`'s
  `RunAnalysisRecord` pattern.
- **`buildEvaluation.ts`** (35 lines) — `buildEvaluation()`, the first-ever constructor for a
  schema-valid `Evaluation` record (`evaluation.schema.ts` existed unused since Phase 1). Reads
  `evaluatorVersion` from the run's own recorded `metadata.evaluatorVersion` rather than a second,
  independently-suppliable parameter. Output is passed through `evaluationSchema.parse`.
- **`reportGraph.ts`** (33 lines) — `ReportGraph`: a `Report` plus every `Evaluation`/`Run`/
  `Trace`/`Outcome`/`Metric`/`Verification`/`Evidence`/`ContextArtifact` it transitively
  references, deduplicated by id (`dedupeById.ts`, 15 lines) — one self-contained, citable object.
- **`buildReport.ts`** (65 lines) — `buildReport(records, experimentId, {title, limitations?,
  generatedAt?})`, the Phase 9 entry point: builds one `Evaluation` per record, validates the
  `Report` via `reportSchema.parse`, and assembles the full `ReportGraph`.
- **`traceEvaluation.ts`** (66 lines) — `traceEvaluation(graph, evaluationId)`, the concrete
  drill-down reader implementing [[12-dashboard-strategy]]'s design principle ("Why should I
  trust this result? ... No black-box KPI."): resolves one Evaluation's full backing chain (run,
  trace, outcome, metrics, verifications, evidence) purely by id lookup within the same graph,
  throwing `BrokenReportGraphError` if a referenced id is missing rather than returning a silent
  partial trace.
- **`reportWriter.ts`** (37 lines) — `writeReport()`/`readReport()`, persisting one experiment's
  `ReportGraph` to `reports/<experimentId>/report.json` (new, gitignored, parallel to
  `experiment-results/`).

`src/experiments/generateReport.ts` (78 lines, new) is the orchestration entry point — parallel to
`runComparisonExperiment.ts`/`analyzeComparisonResults.ts`: reads raw bundles via
`resultsWriter.ts`'s `readAllRunResults()`, adapts each `RunResultBundle` into an
`EvaluatedRunRecord`, and calls `buildReport()`/`writeReport()`. New `npm run report:generate`
script. `src/experiments/resultsWriter.ts`'s `latestExperimentId()` was extracted out of
`analyzeComparisonResults.ts` (no behavior change) so both scripts share it instead of duplicating
it; its `RunResultBundle` doc-comment now explains it is a crash-safe write-ahead record during a
live run, not the canonical output — the `ReportGraph` is.

## Tests

19 new tests across 6 new/edited test files (284 total across 71 files, up from 266/65):
`dedupeById.test.ts`, `buildEvaluation.test.ts` (correct id linkage, `evaluatorVersion` read from
the run's own metadata, fresh id per call), `buildReport.test.ts` (multi-record aggregation,
default/caller-supplied `limitations`, deduplication of a repeated run record, empty-input throw),
`traceEvaluation.test.ts` (full drill-down chain including evidence reached through
`Outcome.evidenceIds`, `BrokenReportGraphError` for an unknown evaluation id), `reportWriter.test.ts`
(round-trip write/read), and `src/experiments/generateReport.test.ts` (end-to-end: raw bundles →
canonical `ReportGraph` → persisted `report.json`, latest-experiment resolution, empty-experiment
throw — same synthetic-bundle pattern as `analyzeComparisonResults.test.ts`, no live LLM/ECC call).
`resultsWriter.test.ts` gained 2 small tests for the extracted `latestExperimentId()`.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 284/284 tests passing across 71
  files, zero lint errors.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new source file is `traceEvaluation.ts` at 66 lines,
  `generateReport.ts` at 78 — both comfortably under the 300-line ceiling.

## Decisions made

ADR-014 in [[14-decisions]]: canonical Report persistence as a self-contained `ReportGraph` (not
just a thin `Report` record with floating id references); a new pure `src/reporting/` layer
decoupled from `src/experiments/`, matching ADR-011's precedent; the existing per-run raw dump is
kept as a crash-safe write-ahead record rather than deleted, with the `ReportGraph` as the new
canonical/authoritative artifact.

## Explicitly not implemented (by design, later work)

- **CSV/Markdown/HTML report formats.** [[13-roadmap]]'s full Phase 9 row lists "JSON, CSV,
  Markdown, HTML"; this round's user-specified exit criterion narrowed scope to the canonical
  `Report` entity/persistence format itself. `ReportGraph` is JSON only.
- **Embedding Phase 7/8's statistical analysis output in the persisted Report.**
  `RepeatedRunAnalysisReport`/`ComponentContribution[]`/`FailureClusterReport`
  (`analyzeComparisonResults.ts`) remain console-printed, in-memory results — not folded into
  `ReportGraph`. This is a natural follow-up, deliberately deferred rather than silently done: this
  round's exit criterion is Runs→Metrics→Evidence traceability, not interpreted statistics.
- **Running this against real experiment data.** No live comparison run has been executed yet
  (Phase 6's remaining scope, [[20-next-actions]]) — `buildReport()`/`generateReport()` are
  validated against synthetic evaluated-run fixtures in tests, the same way Phase 5/7/8's functions
  were validated before real data existed.
- **Deleting or replacing `experiment-results/`'s per-run dump.** Kept deliberately as a crash-safe
  write-ahead mechanism for long LLM-backed runs — see ADR-014's reasoning.

## Known limitations

- `ReportGraph` is a plain TypeScript interface, not a 15th schema-versioned domain entity — only
  its embedded `report` field is a real, versioned Zod entity (`reportSchema`). This matches how
  `ComparisonAnalysisResult` (Phase 6 remainder) is also an unversioned wrapper around versioned
  pieces; nothing about the graph's own shape is meant to be independently cited or diffed across
  versions the way `Report`/`Evaluation`/`Run` etc. are.
- No correction for multiple comparisons is applied anywhere in this phase either — same known
  limitation already flagged in [[phases/phase-07]], still deferred; a `Report`'s `limitations`
  field exists precisely so a caller can name this kind of caveat in the persisted artifact, but
  `generateReport.ts` does not auto-populate it today (the caller must pass `limitations`
  explicitly).
- `traceEvaluation()`'s `trace` field is found by matching `Trace.runId` against the resolved
  `Run.id`, not through a direct id reference on `Evaluation` (the domain model has no
  `Evaluation.traceId` field) — a graph with more than one `Trace` sharing the same `runId` would
  return only the first match. Not expected in practice (one run produces one trace) but not
  schema-enforced either.

## Risks discovered

No new risk-register row was needed — this phase adds persistence for data Phases 3-8 already
produce and validate; it does not introduce a new operational risk category [[16-risks]] tracks.

## Status

Complete (this round's scope: the canonical `Report` entity/persistence format with full
Runs→Metrics→Evidence traceability). Pending user approval to proceed with a live comparison run,
Phase 10 (Dashboard), the remaining Phase 9 roadmap scope (CSV/Markdown/HTML), or any other next
step.
