# 18 — Current State

Last updated: 2026-09-13 (Phase 2 complete).

## What exists

- Repository scaffolding: `package.json`, `tsconfig.json`, `.gitignore`, ESLint flat config,
  Prettier config.
- Full domain model implementation under `src/domain/`: 14 Zod schemas (Task, Experiment,
  Condition, Run, Trace, Evidence, ContextArtifact, Decision, Action, Verification, Outcome,
  Metric, Evaluation, Report) plus shared primitives (branded IDs, semver, ISO timestamps,
  `RunStatus` taxonomy) and `ContextProvider`/`Agent` interfaces. See [[phases/phase-01]].
- Benchmark V1: 30 `Task` records under `benchmark/tasks/*.json`, matching the category
  distribution in [[07-benchmark-strategy]], each with acceptance criteria, a verification method
  description, and a ground truth description. Loaded/validated via `src/benchmark/loadTasks.ts`.
  See [[phases/phase-02]].
- `benchmark/fixtures/` reserved (README only) — actual fixture source code is Phase 3.
- `README.md` updated with EEP positioning and a pointer to this memory bank.
- Full `project-memory-bank/` structure, including `implementation-status.md` and
  `active-context.md` as running save-state files.

## What does not exist yet

- No fixture source code / runnable repositories for the 30 tasks, and no real pinned
  `repository.commitSha` (all use the `"unpinned"` sentinel) — Phase 3.
- No experiment harness, agent adapter, or concrete `ContextProvider`/`Agent` implementation
  (only the interfaces exist) — Phase 3.
- No evaluation/verification execution logic (the `Verification`/`Outcome` schemas exist, and
  each task has a descriptive `verificationMethod`, but nothing executes it yet) — Phase 4.
- No metrics computation (the `Metric` schema and name enum exist, computation does not) —
  Phase 5.
- No ECC adapter or integration — Phase 6.
- No CLI commands of any kind.

## Verification performed

`npm install && npm run build && npm test && npm run lint` — 53 tests passing across 20 test
files, clean build, clean lint. No test files leak into `dist/`. See [[phases/phase-02]] for
details.
