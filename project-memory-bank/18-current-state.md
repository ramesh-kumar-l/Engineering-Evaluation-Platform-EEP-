# 18 — Current State

Last updated: 2026-09-13 (Phase 4 complete).

## What exists

- Repository scaffolding: `package.json`, `tsconfig.json`, `.gitignore`, ESLint flat config,
  Prettier config.
- Full domain model implementation under `src/domain/`: 14 Zod schemas (Task, Experiment,
  Condition, Run, Trace, Evidence, ContextArtifact, Decision, Action, Verification, Outcome,
  Metric, Evaluation, Report) plus shared primitives (branded IDs, a branded `generateId()`,
  semver, ISO timestamps, `RunStatus` taxonomy) and `ContextProvider`/`Agent` interfaces (both
  carry a `runId` on their request types — Phase 3). See [[phases/phase-01]].
- Benchmark V1: 30 `Task` records under `benchmark/tasks/*.json`, matching the category
  distribution in [[07-benchmark-strategy]]. Loaded/validated via `src/benchmark/loadTasks.ts`.
  See [[phases/phase-02]].
- Experiment harness (`src/harness/`): `createIsolatedWorkspace()` (filesystem-copy sandbox),
  `NativeContextProvider` and `NativeAgent` (a working, deterministic Condition-A baseline pair),
  and `executeRun()` orchestrating Task+Condition+Agent+ContextProvider into a schema-valid
  `Run`+`Trace`. `HarnessDependencies` now also carries an optional `onBeforeCleanup` extension
  point (Phase 4) that lets an evaluation layer inspect the workspace before it's torn down. See
  [[phases/phase-03]] and ADR-007 in [[14-decisions]].
- **Deterministic evaluation (`src/evaluation/`, Phase 4):** `testSuiteVerifier` (runs the
  fixture's real `npm test`) and `diffAnalysisVerifier` (generic "did anything change" check),
  combined by `runVerifiers()` per task's free-text `verificationMethod`; `determineOutcomeStatus()`
  — a pure function turning verification results into an authoritative `RunStatus`, always
  overriding the agent's own self-report except for infra-level statuses; `executeEvaluatedRun()`
  — the full Task → `Run`+`Trace`+`Outcome`+`Verification[]`+`Evidence[]` pipeline. Proven to reach
  both `SUCCESS` (via a test-only agent that genuinely fixes `debugging-01`'s bug) and
  `TASK_FAILURE` (via `NativeAgent`, which never fixes anything). See [[phases/phase-04]] and
  ADR-008 in [[14-decisions]].
- 3 of the 30 benchmark tasks (`debugging-01`, `feature-01`, `refactoring-01`) have real,
  runnable fixture source code under `benchmark/fixtures/<id>/` and a real pinned
  `repository.commitSha`; the other 27 remain `"unpinned"` (tracked backlog, not a defect).
  `feature-01` has fixture source code but has not yet been run through `executeEvaluatedRun()` —
  only `debugging-01` and `refactoring-01` have Phase 4 test coverage so far.
- `README.md` updated with EEP positioning and a pointer to this memory bank.
- Full `project-memory-bank/` structure, including `implementation-status.md` and
  `active-context.md` as running save-state files.

## What does not exist yet

- Fixture source code / real pinned `commitSha` for 27 of the 30 tasks — incremental backlog, see
  [[20-next-actions]].
- Verifiers for `static-analysis`, `repository-invariant`, `acceptance-criteria-check`,
  `security-check`, `architecture-check`, `human-review`, `llm-judge` — only `test-suite` and
  `diff-analysis` exist so far, sufficient for the 3 fixtures currently authored; the
  `Verifier` interface makes adding one a single new file (see [[phases/phase-04]]).
- No metrics computation (the `Metric` schema and name enum exist, computation does not) —
  Phase 5.
- No real solving agent (only the deliberately inert `NativeAgent` baseline and Phase 4's
  test-only `FixPaginationAgent`, which never leaves `src/evaluation/evaluateRun.test.ts`) and no
  ECC adapter or integration — Phase 6.
- No CLI commands of any kind.
- No container/process-level sandboxing — isolation is filesystem-copy only (ADR-007);
  `testSuiteVerifier` spawns real child processes with only a wall-clock timeout, no CPU/memory
  limits — tracked as an open risk in [[16-risks]] for when an agent starts executing untrusted
  generated code.

## Verification performed

`npm install && npm run build && npm test && npm run lint` — 89 tests passing across 31 test
files, clean build, clean lint. No test files leak into `dist/`. The compiled `dist/` evaluation
pipeline was also manually exercised end-to-end against the real `debugging-01` fixture. See
[[phases/phase-04]] for details.
