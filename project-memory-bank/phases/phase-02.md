# Phase 02 — Benchmark V1

## Objective (from [[13-roadmap]])

Task schema, benchmark structure, 30 tasks, ground truth, verification.

## Implemented

- 30 `Task` records under `benchmark/tasks/*.json`, one file per task, schema-valid against
  `taskSchema` (`src/domain/task/task.schema.ts`), matching the exact category distribution in
  [[07-benchmark-strategy]]: debugging 6, feature 6, refactoring 5, test-generation 4, migration 3,
  performance 2, code-review 2, architecture 2.
- Each task has a realistic multi-sentence description, 3-5 concrete acceptance criteria, a
  `verificationMethod` description, and a `groundTruth` description of the correct outcome.
- Complexity levels (L1-L5) assigned per task, spanning the full range.
- `src/benchmark/loadTasks.ts` — production loader: reads every `*.json` file in
  `benchmark/tasks/`, validates each against `taskSchema`, throws a `TaskValidationError` naming
  the offending file on any invalid record. Path-resolved via `import.meta.url` so it works
  identically from `src/` (tests) and `dist/` (compiled).
- `src/benchmark/index.ts` barrel; re-exported from the root `src/index.ts`.
- `benchmark/fixtures/README.md` — documents the self-hosted fixture convention and explicitly
  defers populating fixture source code to Phase 3.
- Temporal integrity policy fully specified in [[07-benchmark-strategy]] (was a stub).

## Tests

`src/benchmark/loadTasks.test.ts` — loads the real 30-task directory and asserts: exact count,
exact category distribution, every task has non-empty `groundTruth`/`verificationMethod`, every
task has at least one acceptance criterion, all ids unique; plus an isolated temp-directory case
asserting `TaskValidationError` is thrown and names the bad file. Full suite after Phase 2: 20
test files, 53 tests, all passing — see [[implementation-status]] verification snapshot.

## Decisions made

See ADR-006 in [[14-decisions]]: self-hosted fixtures under `benchmark/fixtures/<id>/` (not
external GitHub repos) to avoid contamination/drift and stay local-first; one JSON file per task;
`repository.commitSha: "unpinned"` as a documented Phase 2/3 boundary sentinel.

## Explicitly not implemented

- No fixture source code exists yet — `benchmark/fixtures/` only has a README. Real, runnable
  mini-repositories and their pinned commit SHAs are Phase 3 (Experiment Harness) work.
- No execution of `verificationMethod` — it is descriptive text for now; turning it into
  executable verification logic is Phase 4 (Deterministic Evaluation).
- No CLI command to list/filter tasks — CLI is Phase 3+.

## Known limitations

`groundTruth` and `verificationMethod` are human-authored descriptions, not yet machine-executable
checks; Phase 4 must translate them into concrete `Verification` records without silently changing
their intent.

## Risks discovered

None new.

## Status

Complete, pending user approval to begin Phase 3 (Experiment Harness).
