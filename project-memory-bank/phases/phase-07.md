# Phase 7 — Experimental Analysis

## Objective

Per this round's user-specified exit criterion (matches [[13-roadmap]]'s Phase 7 row): repeated-
run statistical analysis — confidence intervals and effect size — across task categories and
complexity levels.

## Implemented

New `src/analysis/` module (all files under 300 lines, largest 157):

- **`stats.ts`** — generic descriptive statistics with no domain knowledge (`mean`, `median`,
  `sampleVariance`, `sampleStdDev`, `standardError`) plus the shared `InsufficientSampleSizeError`
  used by both `confidenceInterval.ts` and `effectSize.ts`.
- **`tDistribution.ts`** — exact, published two-tailed t-table critical values for degrees of
  freedom 1-30 at three confidence levels (90%/95%/99%), falling back to the exact standard-
  normal z-critical value beyond df=30. Deliberately not a hand-rolled inverse-t approximation —
  see ADR-011.
- **`confidenceInterval.ts`** — `meanConfidenceInterval()` (Student's t interval for continuous
  metrics) and `proportionConfidenceInterval()` (Wilson score interval for `task-success`, the
  one true per-run Bernoulli metric). Both throw `InsufficientSampleSizeError` rather than
  returning a fabricated interval when there isn't enough data.
- **`effectSize.ts`** — `cohensD()` (pooled-variance standardized mean difference, for continuous
  metrics) and `cohensH()` (arcsine-transform difference, for proportion metrics), both classified
  into Cohen's conventional negligible/small/medium/large buckets.
- **`groupBy.ts`** — a generic, domain-agnostic grouping helper.
- **`analysisInput.ts`** — `RunAnalysisRecord`, the structural input type pairing one run's
  already-computed `Metric[]` with its condition name and task category/complexity (decoupled
  from `harness`/`evaluation` types, matching the pattern `RunMetricsInput` already established);
  `metricKindFor()` (only `task-success` is a proportion metric; everything else is continuous)
  and `extractMetricValues()`.
- **`repeatedRunAnalysis.ts`** — `summarizeGroup()` (one metric, one condition's repeated runs →
  n/mean/median/stddev/confidence interval) and `compareConditions()` (baseline vs. treatment →
  mean difference + effect size). Both return a discriminated `status: 'ok' | 'insufficient-data'`
  result rather than throwing through the orchestration layer — see ADR-011.
- **`groupedAnalysis.ts`** — `analyzeRepeatedRuns()`, the Phase 7 entry point: for each requested
  metric, computes an "overall" summary/comparison plus one per task category and one per
  complexity level actually present in the input records.

No new Zod domain entity was added (matching Phase 5's `AggregatedMetric` precedent) — these are
plain TypeScript interfaces, since nothing here is persisted to disk yet (that is Phase 9's job).

## Tests

8 new test files, 44 new tests (174 total across 49 files, up from 130/41):
`stats.test.ts`, `tDistribution.test.ts` (both checked against hand-verified/published reference
values), `confidenceInterval.test.ts` (a Student-t worked example and a published Wilson-interval
worked example — 15/20 successes at 95% ≈ [0.531, 0.888]), `effectSize.test.ts` (hand-worked
Cohen's d and Cohen's h examples with known expected values), `groupBy.test.ts`,
`analysisInput.test.ts`, `repeatedRunAnalysis.test.ts`, and `groupedAnalysis.test.ts` (covers
category/complexity breakdown and the "only baseline condition present" no-crash case).

## Validation

- `npm run build && npm test && npm run lint` — clean build, 174/174 tests passing across 49
  files, zero lint errors.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new file is `repeatedRunAnalysis.ts` at 157 lines,
  comfortably under the 300-line ceiling.
- Every statistical function was checked against a hand-worked or published reference value in
  its test file, not only against itself (e.g. asserting output equals a re-implementation of the
  same formula) — see ADR-011's reasoning for why exact table values were chosen over an
  approximation formula.

## Decisions made

ADR-011 in [[14-decisions]]: hand-rolled statistics with exact published critical values (no new
npm dependency, no approximated inverse-distribution formula); explicit `insufficient-data`
results instead of exceptions propagating through the category/complexity orchestrator.

## Explicitly not implemented (by design, later work)

- **Running this analysis against real experiment data.** No real multi-condition comparison run
  exists yet — Phase 6's remaining scope (a real solving agent for Condition B/C, an actual
  native-vs-ECC comparison run) is still open, per [[phases/phase-06]] and [[20-next-actions]].
  `analyzeRepeatedRuns()` is validated against synthetic fixture data in tests today, the same way
  Phase 5's metrics functions were validated before real fixtures existed.
- **Failure analysis** (the fourth item in [[13-roadmap]]'s Phase 7 row, alongside repeated runs/
  category/complexity analysis) — this round's user-specified exit criterion named only
  confidence intervals and effect size across categories/complexity; failure-mode breakdown (e.g.
  which verification method most often fails, clustering failure causes) was not requested and is
  not built. Flagged as remaining Phase 7 roadmap scope in [[20-next-actions]].
- **Persistence / a `Report` entity wiring.** `analyzeRepeatedRuns()`'s output is returned
  in-memory, like every other Phases 3-6 computation; writing it to disk as JSON/CSV/Markdown/HTML
  is Phase 9's job (project-memory-bank/13-roadmap.md).
- **Multi-metric composite scoring or a "winner" verdict.** Deliberately never implemented — see
  project-memory-bank/08-metrics.md §Anti-goal; `analyzeRepeatedRuns()` reports intervals,
  differences, and standardized effect sizes only.

## Known limitations

- Only three confidence levels are supported (90%/95%/99%) — an intentional restriction so every
  critical value is an exact table lookup rather than an approximation formula (ADR-011), not an
  oversight.
- `meanConfidenceInterval()`/`cohensD()` require at least 2 observations per group;
  `proportionConfidenceInterval()`/`cohensH()` require at least 1. Groups below that produce an
  explicit `insufficient-data` result rather than a number — expected and common until real
  repeated runs accumulate.
- No correction for multiple comparisons (e.g. Bonferroni) is applied when many metrics/categories
  /complexity levels are analyzed at once — each interval/effect size is independently valid at
  its stated confidence level, but reading many of them together without that context risks
  overstating significance. Not addressed this phase; flagged for whoever builds Phase 9's
  reporting layer to caveat appropriately, consistent with
  project-memory-bank/06-evaluation-methodology.md §Statistical discipline.

## Risks discovered

No new risk-register row was needed — project-memory-bank/16-risks.md's existing "False
confidence in small-sample results" row already anticipated exactly this phase's failure mode
(now mitigated in code by the `insufficient-data` status rather than a fabricated interval); its
Notes were left unchanged since ADR-009's citation of it still applies, extended by ADR-011.

## Status

Complete (this round's scope: confidence intervals and effect size across categories/complexity),
pending user approval to proceed with the rest of Phase 7's roadmap scope (failure analysis) once
real experiment data exists, the rest of Phase 6 (real solving agent, actual comparison run), or
to move to Phase 8.
