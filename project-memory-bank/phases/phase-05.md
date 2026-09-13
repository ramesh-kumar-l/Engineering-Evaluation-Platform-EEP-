# Phase 5 — Metrics

## Objective

Per [[13-roadmap]]: the 5 primary + secondary metrics computed and stored as `Metric` records per
run.

## Implemented

- **`src/metrics/computeMetrics.ts`** — `computeRunMetrics(input)`, the Phase 5 entry point:
  takes a completed, evaluated run (structurally shaped like Phase 4's `EvaluatedRunOutcome`) and
  returns one `Metric` record per computable metric name, never a composite score, per
  [[08-metrics]] §Anti-goal.
- **`src/metrics/primaryMetrics.ts`** — all 5 primary metrics: `task-success` (1/0 from
  `Outcome.status`), `engineering-quality` (fraction of executed verifications that passed, a
  documented proxy — see ADR-009), `time-to-correct-outcome` (`Run.startedAt` → `finishedAt`, ms),
  `context-efficiency` (task-success per 1000 context tokens, a documented proxy — see ADR-009),
  `human-intervention` (always 0 — no human-in-the-loop mechanism exists yet).
- **`src/metrics/secondaryMetrics.ts`** — 9 secondary metrics honestly computable from existing
  `Trace`/`Verification`/`ContextArtifact` data: `context-tokens`, `tool-calls`, `agent-turns`,
  `files-read`, `files-changed`, `retries`, `failed-attempts`, `provenance-completeness`,
  `verification-completeness`. The other 8 named secondary metrics
  (`evidence-recall`/`-precision`/`-authority`/`-freshness`, `context-redundancy`,
  `regression-rate`, `risk-classification`, `decision-confidence`) are explicitly NOT computed —
  each needs a data source that does not exist yet (see ADR-009 for the full reasoning per
  metric).
- **`src/metrics/aggregateMetrics.ts`** — `aggregateMetricsByName()`, a lightweight mean/median/
  sample-stddev summarizer across a list of `Metric` records sharing the same `name`. Explicitly
  not statistical inference (no confidence intervals, no significance testing) — that is Phase 7.
- **`src/metrics/estimateTokens.ts`** / **`metricHelpers.ts`** / **`metricsInput.ts`** — small
  supporting utilities: a ~4-char/token estimate for providers that don't report a real
  `tokenCount`, the single `buildMetric()`/`durationMs()` constructors, and the `RunMetricsInput`
  structural type.
- **Two small, additive extensions** to already-shipped Phase 3/4 code, both backward-compatible:
  `HarnessRunOutcome` (Phase 3) gained an optional `contextArtifact` field (the full object, not
  just its id — it was already computed and discarded); `EvaluatedRunOutcome` (Phase 4) gained an
  `executionErrors` field (also already computed and discarded). No existing field changed; no
  existing Phase 3/4 test needed modification.

## Tests

8 new test files, 27 new tests (116 total across 45 files, up from 89/37):
`estimateTokens.test.ts`, `metricHelpers.test.ts`, `primaryMetrics.test.ts` (all 5 primary metrics,
including the context-efficiency success-vs-failure comparison and the zero-verifications edge
case), `secondaryMetrics.test.ts` (all 9, including the verification-completeness case that
accounts for a verifier that could not execute at all), `aggregateMetrics.test.ts` (grouping,
mean/median/stddev, single-value zero-stddev case, unit passthrough), and
`computeMetrics.test.ts` — a real end-to-end run of `debugging-01` through
`executeEvaluatedRun()` then `computeRunMetrics()`, asserting all 14 metrics are produced and
every one is schema-valid.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 116/116 tests passing across 45
  files, zero lint errors.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new source file is `secondaryMetrics.ts`/`aggregateMetrics.ts`
  at 58 lines; `runHarness.ts` grew from 152 to 157 lines for the additive `contextArtifact` field
  — both comfortably under the 300-line ceiling.
- Security review note: no new attack surface — this phase adds pure, I/O-free computation over
  already-produced records; no new process spawning, network calls, or file access.

## Decisions made

ADR-009 in [[14-decisions]]: which metrics are honestly computable now vs. explicitly deferred;
the two documented proxy metrics (`engineering-quality`, `context-efficiency`); the lightweight,
non-statistical aggregation summarizer; the two additive Phase 3/4 field extensions.

## Explicitly not implemented (by design, later phases)

- 8 of 22 named metrics (`evidence-recall`/`-precision`/`-authority`/`-freshness`,
  `context-redundancy`, `regression-rate`, `risk-classification`, `decision-confidence`) — no data
  source exists yet; see ADR-009.
- Persisting `Metric` records to disk / a metrics store — this phase computes metrics in-memory
  from an `EvaluatedRunOutcome`; where/how metric records are written alongside `Run`/`Trace`/
  `Outcome` artifacts on disk is a CLI/persistence concern for a later phase, not yet built (no
  CLI exists at all yet).
- Real statistical rigor (confidence intervals, significance testing, outlier handling) across
  repeated runs — Phase 7 (Experimental Analysis).
- Any per-category/per-complexity metric breakdown — Phase 7.
- `Evaluation` entity population — still deferred; this phase produces `Metric` records only.

## Known limitations

- `engineering-quality` and `context-efficiency` are documented proxies, not the full definitions
  in [[08-metrics]] — both will need revisiting once richer verifiers (Phase 4 backlog) and a real
  curated `ContextProvider` (Phase 6) exist to measure the concepts they're meant to represent.
- `aggregateMetricsByName()` cannot enforce that its input metrics all belong to the same
  Task×Condition pair — that's the caller's responsibility, since a `Metric` record only carries a
  `runId`. Misuse would silently average unrelated metrics together; acceptable for now since no
  caller exists yet outside tests.
- `estimateTokenCount()`'s ~4-chars/token heuristic is a rough approximation, not a real
  tokenizer; acceptable while `NativeContextProvider` is the only context source (Phase 6's
  ECC-backed provider should report a real `tokenCount` instead of relying on the estimate).

## Risks discovered

None new. The existing "false confidence in small-sample results" risk in [[16-risks]] is directly
why `aggregateMetricsByName()` was deliberately kept non-statistical this phase — sharpens that
risk's mitigation rather than introducing a new one.

## Status

Complete, pending user approval to begin Phase 6 (ECC Integration).
