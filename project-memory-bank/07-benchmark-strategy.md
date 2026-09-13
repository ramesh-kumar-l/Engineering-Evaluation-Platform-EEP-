# 07 — Benchmark Strategy

Status: design target for Phase 2 (Benchmark V1). No tasks exist yet as of Phase 0.

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

## Temporal integrity policy

See [[06-evaluation-methodology]] §Temporal integrity. To be fully specified alongside the first
benchmark tasks in Phase 2.

## Relationship to other memory-bank files

Task schema: [[schemas/task-schema]]. Metrics computed per task: [[08-metrics]]. Experiments run
against these tasks: [[09-experiment-strategy]].
