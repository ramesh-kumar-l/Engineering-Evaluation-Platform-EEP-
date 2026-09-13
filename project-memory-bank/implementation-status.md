# Implementation Status

A fine-grained, per-module ledger — more granular than [[19-phase-status]]'s per-phase table.
Update this whenever a major feature/module is finished, not only at phase boundaries.

## src/domain/common/

| Module | Status |
|---|---|
| `ids.ts` (branded IDs, 14 entities) | Done |
| `idGenerator.ts` (`generateId<Brand>()`) | Done (Phase 3) |
| `semver.ts` | Done |
| `timestamps.ts` | Done |
| `status.ts` (`RunStatus` taxonomy) | Done |

## src/domain/ (entity schemas)

| Entity | File | Status |
|---|---|---|
| Task | `task/task.schema.ts` | Done |
| Condition | `experiment/condition.schema.ts` | Done |
| Experiment | `experiment/experiment.schema.ts` | Done |
| ContextArtifact | `evidence/context-artifact.schema.ts` | Done |
| Evidence | `evidence/evidence.schema.ts` | Done |
| Action | `trace/action.schema.ts` | Done |
| Decision | `trace/decision.schema.ts` | Done |
| Trace | `trace/trace.schema.ts` | Done |
| Verification | `verification/verification.schema.ts` | Done |
| Outcome | `outcome/outcome.schema.ts` | Done |
| Run | `run/run.schema.ts` | Done |
| Metric | `metric/metric.schema.ts` | Done |
| Evaluation | `evaluation/evaluation.schema.ts` | Done |
| Report | `report/report.schema.ts` | Done |

## src/domain/providers/

| Interface | Status |
|---|---|
| `ContextProvider` (now carries `runId` on its request — Phase 3) | Interface defined; native implementation Phase 3, ECC-backed implementation Phase 6 — both Done |
| `Agent` (now carries `runId` on its request — Phase 3) | Interface defined; first implementation (`NativeAgent`) in `src/harness/` (Phase 3); a real solving agent is later work |

## src/benchmark/ (Phase 2)

| Module | Status |
|---|---|
| `loadTasks.ts` (read + validate `benchmark/tasks/*.json` against `taskSchema`) | Done |
| `index.ts` (barrel) | Done |

## src/harness/ (Phase 3, extended Phase 4/5/6)

| Module | Status |
|---|---|
| `workspace.ts` (`createIsolatedWorkspace` — filesystem-copy sandbox, ADR-007) | Done |
| `support/listFiles.ts` (shared recursive file listing, capped) | Done |
| `providers/nativeContextProvider.ts` (`NativeContextProvider`) | Done |
| `providers/eccPackageSchema.ts` (independent Zod mirror of ECC's `EngineeringContextPackage` contract, ADR-010) | Done (Phase 6) |
| `providers/eccCliInvoker.ts` (`ProcessEccCliInvoker` — configurable subprocess wrapper around ECC's `ecc context` CLI, ADR-010) | Done (Phase 6) |
| `providers/eccContextProvider.ts` (`EccContextProvider implements ContextProvider` — Condition B/C's real ECC-backed source) | Done (Phase 6) |
| `agents/nativeAgent.ts` (`NativeAgent`) | Done |
| `runHarness.ts` (`executeRun` — Task+Condition+Agent+ContextProvider → Run+Trace; carries an optional `onBeforeCleanup` hook (Phase 4) and now also returns the full `contextArtifact` on `HarnessRunOutcome` (Phase 5, ADR-009)) | Done |
| `index.ts` (barrel) | Done |

## src/evaluation/ (Phase 4)

| Module | Status |
|---|---|
| `verifiers/verifier.types.ts` (`Verifier` contract, `VerificationExecutionError`/`VerificationTimeoutError`) | Done |
| `verifiers/testSuiteVerifier.ts` (spawns fixture's real `npm test`) | Done |
| `verifiers/diffAnalysisVerifier.ts` (generic pristine-vs-workspace change detection) | Done |
| `verifiers/index.ts` (`ALL_VERIFIERS` registry + barrel) | Done |
| `runVerifiers.ts` (runs every applicable verifier, collects results + execution errors) | Done |
| `determineOutcome.ts` (`determineOutcomeStatus` — pure, exhaustively tested status rule, ADR-008) | Done |
| `evaluateRun.ts` (`executeEvaluatedRun` — Task → Run+Trace+Outcome+Verification[]+Evidence[]) | Done |
| `index.ts` (barrel) | Done |
| Verifiers for `static-analysis`, `repository-invariant`, `acceptance-criteria-check`, `security-check`, `architecture-check`, `human-review`, `llm-judge` | Not started — add as a fixture needs them |

## src/metrics/ (Phase 5)

| Module | Status |
|---|---|
| `estimateTokens.ts` (~4-char/token fallback estimate) | Done |
| `metricHelpers.ts` (`buildMetric`, `durationMs`) | Done |
| `metricsInput.ts` (`RunMetricsInput` structural type) | Done |
| `primaryMetrics.ts` (all 5 primary metrics) | Done |
| `secondaryMetrics.ts` (9 of 17 secondary metrics) | Done |
| `computeMetrics.ts` (`computeRunMetrics` — the Phase 5 entry point) | Done |
| `aggregateMetrics.ts` (`aggregateMetricsByName` — mean/median/stddev, non-statistical) | Done |
| `index.ts` (barrel) | Done |
| 8 secondary metrics: evidence-recall/-precision/-authority/-freshness, context-redundancy, regression-rate, risk-classification, decision-confidence | Not started — no data source exists yet, see ADR-009 |

## benchmark/ (Phase 2, updated Phase 3)

| Item | Status |
|---|---|
| 30 task records, `benchmark/tasks/*.json` | Done — matches [[07-benchmark-strategy]] distribution exactly |
| Temporal integrity policy | Done — fully specified in [[07-benchmark-strategy]] |
| Fixture source code, `benchmark/fixtures/<id>/` | 3 of 30 done (`debugging-01`, `feature-01`, `refactoring-01`) — Phase 3; remaining 27 are tracked backlog, see [[20-next-actions]] |
| Real pinned `repository.commitSha` per task | 3 of 30 done (same 3 tasks, real git SHAs — ADR-007); other 27 use the `"unpinned"` sentinel (ADR-006) |

## Not started

Fixture repositories + real commit pins for 27 of 30 tasks (incremental backlog), verifiers for
7 of the 9 `verificationMethod` enum values (add as needed), 8 of 22 named metrics with no data
source yet (ADR-009), a real solving agent for Condition B/C, an actual multi-condition
comparison run (Native vs. ECC-backed) against the benchmark, CLI, metric/artifact persistence to
disk, container/process-level sandboxing (open risk, see [[16-risks]]), reporting/dashboard
(Phase 9-10).

## Verification snapshot

Last run: `npm run build && npm test && npm run lint` — clean build, 130/130 tests passing across
41 files (one test exercises a real sibling ECC checkout end-to-end and is `skipIf`-gated when
that checkout is absent), zero lint errors. Confirmed no test files leak into `dist/` after
`rm -rf dist && npm run build`.
Re-run this before trusting this ledger; it is a snapshot, not a live status.
