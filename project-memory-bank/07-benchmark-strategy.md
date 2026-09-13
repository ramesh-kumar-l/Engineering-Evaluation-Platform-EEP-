# 07 — Benchmark Strategy

Status: Benchmark V1 complete (Phase 2). 30 tasks exist under `benchmark/tasks/`, one JSON file
per task, schema-valid against `taskSchema` (`src/domain/task/task.schema.ts`). Loaded and
validated via `src/benchmark/loadTasks.ts`.

## Target size and distribution (~30 tasks)

| Category | Count |
|---|---|
| Debugging | 6 |
| Feature | 6 |
| Refactoring | 5 |
| Test generation | 4 |
| Migration | 3 |
| Performance | 2 |
| Code review | 2 |
| Architecture | 2 |
| **Total** | **30** |

## Complexity levels

- L1 — trivial
- L2 — straightforward
- L3 — multi-file
- L4 — cross-cutting
- L5 — architectural/systemic

## Quality rules

Tasks must: be realistic; have objective verification where possible; represent diverse
engineering work; contain different failure modes; avoid trivial keyword retrieval; avoid
future-information leakage; avoid benchmark contamination where practical; be reproducible; have
clear acceptance criteria; contain sufficient ground truth for evaluation; distinguish
correctness from test passing.

**Do not optimize the benchmark to favor ECC or any other system under test** — see
[[00-project-charter]] §Scientific integrity rule.

## Benchmark structure (Phase 2 decision — see ADR-006 in [[14-decisions]])

- One JSON file per task under `benchmark/tasks/<id>.json`, `<id>` = `<category>-<NN>` (e.g.
  `debugging-01`), validated against `taskSchema` at load time by `src/benchmark/loadTasks.ts`.
- Fixture repositories are **self-hosted inside EEP** at `benchmark/fixtures/<id>/` (not external
  GitHub repos) — chosen specifically to satisfy the quality rules below ("avoid benchmark
  contamination", "be reproducible", local-first per [[04-architecture]]) without depending on
  external repo drift or availability.
- Every Phase 2 task record uses the sentinel `repository.commitSha: "unpinned"`. Actual fixture
  source code and a real pinned commit SHA are **Phase 3 (Experiment Harness)** work — that phase
  owns "environment isolation" per [[13-roadmap]], which is when a real checkout first matters.
  Do not treat `"unpinned"` as a defect; it is the documented Phase 2/3 boundary marker.

## Temporal integrity policy (fully specified)

- Every task pins a `repository.commitSha` (a fixed historical state, once assigned in Phase 3).
  An agent under evaluation must only see repository content as of that commit — never a later
  commit, and never a fixture edit made after the task was authored.
- `Task.createdAt` records authoring time. Any evidence or context artifact supplied to an agent
  must not be dated later than the task's pinned repository state — `ContextProvider`
  implementations must exclude future-dated sources (enforced starting Phase 3/6).
- Self-hosted fixtures make future-leakage checking tractable: there is no hidden upstream history
  after the pin, unlike a live external repository that could gain commits between benchmark
  authoring and a later run.
- `Task.groundTruth` and `acceptanceCriteria` are evaluator-only inputs (Phase 4) — they must
  never be exposed to the agent under evaluation at run time.
- If a fixture must change after it has been used for scored runs (e.g. a flaky test fix), bump
  `Task.taskVersion` rather than mutating the existing fixture in place; prior results stay tied
  to the superseded `taskVersion`, mirroring the Evaluation immutability policy in
  [[10-reproducibility]].
- `Experiment.benchmarkVersion` (already in `experiment.schema.ts`) freezes which snapshot of
  `benchmark/tasks/` + `benchmark/fixtures/` an experiment used.

## Relationship to other memory-bank files

Task schema: [[schemas/task-schema]]. Metrics computed per task: [[08-metrics]]. Experiments run
against these tasks: [[09-experiment-strategy]].
