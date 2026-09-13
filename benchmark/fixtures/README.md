# Benchmark Fixtures

This directory will hold one self-contained mini-repository per task under
`benchmark/tasks/` (e.g. `benchmark/fixtures/debugging-01/`), each pinned by a
`repository.commitSha` on its corresponding task record.

Populating actual runnable fixture source code is **Phase 3 (Experiment
Harness)** work — see `project-memory-bank/13-roadmap.md`, which assigns
"environment isolation" to Phase 3, not Phase 2. Phase 2 (Benchmark V1)
defines the task contract and reserves this path convention; every Phase 2
task record currently uses the sentinel `"unpinned"` for `commitSha`,
documented in `project-memory-bank/07-benchmark-strategy.md`.
