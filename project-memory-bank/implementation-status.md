# Implementation Status

A fine-grained, per-module ledger — more granular than [[19-phase-status]]'s per-phase table.
Update this whenever a major feature/module is finished, not only at phase boundaries.

## src/domain/common/

| Module | Status |
|---|---|
| `ids.ts` (branded IDs, 14 entities) | Done |
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
| `ContextProvider` | Interface defined; no implementation yet (Phase 3/6) |
| `Agent` | Interface defined; no implementation yet (Phase 3) |

## src/benchmark/ (Phase 2)

| Module | Status |
|---|---|
| `loadTasks.ts` (read + validate `benchmark/tasks/*.json` against `taskSchema`) | Done |
| `index.ts` (barrel) | Done |

## benchmark/ (Phase 2)

| Item | Status |
|---|---|
| 30 task records, `benchmark/tasks/*.json` | Done — matches [[07-benchmark-strategy]] distribution exactly |
| Temporal integrity policy | Done — fully specified in [[07-benchmark-strategy]] |
| Fixture source code, `benchmark/fixtures/<id>/` | Not started — Phase 3 (only a README placeholder exists) |
| Real pinned `repository.commitSha` per task | Not started — all 30 tasks use the `"unpinned"` sentinel (ADR-006) |

## Not started

Fixture repositories + real commit pins (Phase 3), experiment harness (Phase 3), evaluation
engine (Phase 4), metrics computation (Phase 5), ECC adapter (Phase 6), CLI (Phase 3+),
reporting/dashboard (Phase 9-10).

## Verification snapshot

Last run: `npm run build && npm test && npm run lint` — clean build, 53/53 tests passing across
20 files, zero lint errors. Confirmed no test files leak into `dist/` after `rm -rf dist && npm
run build`. Re-run this before trusting this ledger; it is a snapshot, not a live status.
