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
| `ContextProvider` (now carries `runId` on its request — Phase 3) | Interface defined; first implementation in `src/harness/` (Phase 3); ECC-backed implementation is Phase 6 |
| `Agent` (now carries `runId` on its request — Phase 3) | Interface defined; first implementation (`NativeAgent`) in `src/harness/` (Phase 3); a real solving agent is later work |

## src/benchmark/ (Phase 2)

| Module | Status |
|---|---|
| `loadTasks.ts` (read + validate `benchmark/tasks/*.json` against `taskSchema`) | Done |
| `index.ts` (barrel) | Done |

## src/harness/ (Phase 3, extended Phase 4)

| Module | Status |
|---|---|
| `workspace.ts` (`createIsolatedWorkspace` — filesystem-copy sandbox, ADR-007) | Done |
| `support/listFiles.ts` (shared recursive file listing, capped) | Done |
| `providers/nativeContextProvider.ts` (`NativeContextProvider`) | Done |
| `agents/nativeAgent.ts` (`NativeAgent`) | Done |
| `runHarness.ts` (`executeRun` — Task+Condition+Agent+ContextProvider → Run+Trace; now also carries an optional `onBeforeCleanup` hook, Phase 4) | Done |
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

## benchmark/ (Phase 2, updated Phase 3)

| Item | Status |
|---|---|
| 30 task records, `benchmark/tasks/*.json` | Done — matches [[07-benchmark-strategy]] distribution exactly |
| Temporal integrity policy | Done — fully specified in [[07-benchmark-strategy]] |
| Fixture source code, `benchmark/fixtures/<id>/` | 3 of 30 done (`debugging-01`, `feature-01`, `refactoring-01`) — Phase 3; remaining 27 are tracked backlog, see [[20-next-actions]] |
| Real pinned `repository.commitSha` per task | 3 of 30 done (same 3 tasks, real git SHAs — ADR-007); other 27 use the `"unpinned"` sentinel (ADR-006) |

## Not started

Fixture repositories + real commit pins for 27 of 30 tasks (incremental backlog), verifiers for
5 of the 7 remaining `verificationMethod` enum values (add as needed), metrics computation
(Phase 5), a real solving agent and ECC adapter (Phase 6), CLI, container/process-level
sandboxing (open risk, see [[16-risks]]), reporting/dashboard (Phase 9-10).

## Verification snapshot

Last run: `npm run build && npm test && npm run lint` — clean build, 89/89 tests passing across
31 files, zero lint errors. Confirmed no test files leak into `dist/` after `rm -rf dist && npm
run build`. The compiled `dist/` evaluation pipeline was also manually run end-to-end against the
real `debugging-01` fixture (produced `Outcome.status: TASK_FAILURE` as expected for `NativeAgent`).
Re-run this before trusting this ledger; it is a snapshot, not a live status.
