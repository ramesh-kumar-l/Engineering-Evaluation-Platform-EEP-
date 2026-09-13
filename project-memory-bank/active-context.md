# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation), Phase 1 (Evaluation Contract), and Phase 2 (Benchmark V1) are complete.
Phase 3 (Experiment Harness) is now also implemented and verified: `src/harness/` provides
filesystem-copy environment isolation (`createIsolatedWorkspace`), a working Condition-A baseline
pair (`NativeContextProvider` + `NativeAgent`), and an orchestrator (`executeRun`) that runs a
Task end-to-end and produces a schema-valid `Run` + `Trace`. Proven against 3 real, git-committed
fixtures (`debugging-01`, `feature-01`, `refactoring-01`) — the other 27 of the 30 benchmark
tasks still use the `"unpinned"` sentinel by deliberate, user-confirmed scope choice for this
phase. Full detail in [[phases/phase-03]], `implementation-status.md`, and ADR-007 in
[[14-decisions]].

## What is NOT done

27 of the 30 tasks have no fixture source code yet (tracked backlog, see [[20-next-actions]], not
a defect). No verification execution or `Outcome` construction exists — the harness's
`agentReportedStatus` on `Trace` is the agent's own self-report only, never authoritative. No
metrics logic, no real solving agent, no ECC adapter, no CLI, no container/process-level
sandboxing (isolation is filesystem-copy only — see the open risk in [[16-risks]]). Do not assume
any of these exist without checking `implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 3 completion was reported to the user and
Phase 4 (Deterministic Evaluation) has NOT started. Do not begin Phase 4 work without an explicit
new approval message from the user, even if this file is being read in a fresh session — see
[[20-next-actions]] and [[00-project-charter]] §Working protocol. Phase 4's first job is turning
each task's descriptive `verificationMethod` into real, executable checks and constructing
`Outcome` records from them.

## Process reminders for whoever (human or agent) picks this up

- Read the memory bank before source code (this file, then [[18-current-state]] and
  [[19-phase-status]]) — it's kept deliberately more token-efficient than re-deriving state
  from the repo.
- Keep source files under ~300 lines; the `src/domain/`, `src/benchmark/`, and `src/harness/`
  layout (one small file per concern) is the pattern to continue.
- Update this file and `implementation-status.md` at the end of any major feature, not only at
  phase boundaries — that's what keeps this file trustworthy as a save state.
- Never commit or push without the user explicitly asking, per the environment's Git Safety
  Protocol.
- Fixture authoring convention (ADR-007): to add a real fixture, build it in a scratch location,
  `git commit` it there to mint a real SHA, then copy only the resulting working tree (no
  `.git`) into `benchmark/fixtures/<id>/` and update that task's `repository.commitSha` — never
  `git init` directly inside `benchmark/fixtures/<id>/` (creates a nested-repo "gitlink").
