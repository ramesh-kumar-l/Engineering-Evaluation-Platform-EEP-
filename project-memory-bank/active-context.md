# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation) and Phase 1 (Evaluation Contract) are complete. Phase 2 (Benchmark V1) is
now also implemented and verified: 30 `Task` records exist under `benchmark/tasks/*.json`,
schema-valid against `taskSchema`, matching the exact category/complexity distribution in
[[07-benchmark-strategy]], each with acceptance criteria, a verification-method description, and
a ground-truth description. A production loader (`src/benchmark/loadTasks.ts`) reads and
validates them. Full detail in [[phases/phase-02]] and `implementation-status.md`.

## What is NOT done

No fixture source code exists for any of the 30 tasks yet — `benchmark/fixtures/` only has a
README explaining the convention. Every task's `repository.commitSha` is the documented
`"unpinned"` sentinel (see ADR-006 in [[14-decisions]]), to be replaced with a real value in
Phase 3. No experiment harness, no agent/context-provider implementation, no evaluation/metrics
logic, no CLI, no ECC adapter. Do not assume any of these exist without checking
`implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 2 completion was reported to the user and
Phase 3 (Experiment Harness) has NOT started. Do not begin Phase 3 work without an explicit new
approval message from the user, even if this file is being read in a fresh session — see
[[20-next-actions]] and [[00-project-charter]] §Working protocol. Phase 3's first job is
authoring real fixture repositories for the 30 tasks and assigning real commit SHAs.

## Process reminders for whoever (human or agent) picks this up

- Read the memory bank before source code (this file, then [[18-current-state]] and
  [[19-phase-status]]) — it's kept deliberately more token-efficient than re-deriving state
  from the repo.
- Keep source files under ~300 lines; the `src/domain/` and `src/benchmark/` layout (one small
  file per concern) is the pattern to continue.
- Update this file and `implementation-status.md` at the end of any major feature, not only at
  phase boundaries — that's what keeps this file trustworthy as a save state.
- Never commit or push without the user explicitly asking, per the environment's Git Safety
  Protocol.
