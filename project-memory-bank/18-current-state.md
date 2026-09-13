# 18 — Current State

Last updated: 2026-09-13 (Phase 3 complete).

## What exists

- Repository scaffolding: `package.json`, `tsconfig.json`, `.gitignore`, ESLint flat config,
  Prettier config.
- Full domain model implementation under `src/domain/`: 14 Zod schemas (Task, Experiment,
  Condition, Run, Trace, Evidence, ContextArtifact, Decision, Action, Verification, Outcome,
  Metric, Evaluation, Report) plus shared primitives (branded IDs, a branded `generateId()`,
  semver, ISO timestamps, `RunStatus` taxonomy) and `ContextProvider`/`Agent` interfaces (both now
  carry a `runId` on their request types — Phase 3). See [[phases/phase-01]].
- Benchmark V1: 30 `Task` records under `benchmark/tasks/*.json`, matching the category
  distribution in [[07-benchmark-strategy]], each with acceptance criteria, a verification method
  description, and a ground truth description. Loaded/validated via `src/benchmark/loadTasks.ts`.
  See [[phases/phase-02]].
- Experiment harness (`src/harness/`): `createIsolatedWorkspace()` (filesystem-copy sandbox),
  `NativeContextProvider` and `NativeAgent` (a working, deterministic Condition-A baseline pair),
  and `executeRun()` orchestrating Task+Condition+Agent+ContextProvider into a schema-valid
  `Run`+`Trace`. See [[phases/phase-03]] and ADR-007 in [[14-decisions]].
- 3 of the 30 benchmark tasks (`debugging-01`, `feature-01`, `refactoring-01`) now have real,
  runnable fixture source code under `benchmark/fixtures/<id>/` and a real pinned
  `repository.commitSha`; the other 27 remain `"unpinned"` (tracked backlog, not a defect).
- `README.md` updated with EEP positioning and a pointer to this memory bank.
- Full `project-memory-bank/` structure, including `implementation-status.md` and
  `active-context.md` as running save-state files.

## What does not exist yet

- Fixture source code / real pinned `commitSha` for 27 of the 30 tasks — incremental backlog, see
  [[20-next-actions]].
- No verification execution logic or `Outcome` construction — the `Verification`/`Outcome`
  schemas exist and each task has a descriptive `verificationMethod`, but nothing executes it yet
  — Phase 4.
- No metrics computation (the `Metric` schema and name enum exist, computation does not) —
  Phase 5.
- No real solving agent (only the deliberately inert `NativeAgent` baseline exists) and no ECC
  adapter or integration — Phase 6.
- No CLI commands of any kind.
- No container/process-level sandboxing — isolation is filesystem-copy only (ADR-007); tracked as
  an open risk in [[16-risks]] for when an agent starts executing untrusted generated code.

## Verification performed

`npm install && npm run build && npm test && npm run lint` — 67 tests passing across 26 test
files, clean build, clean lint. No test files leak into `dist/`. The compiled `dist/` harness was
also manually exercised end-to-end against the real `debugging-01` fixture. See [[phases/phase-03]]
for details.
