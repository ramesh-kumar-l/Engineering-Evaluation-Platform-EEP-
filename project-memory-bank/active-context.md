# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation), Phase 1 (Evaluation Contract), Phase 2 (Benchmark V1), and Phase 3
(Experiment Harness) are complete. Phase 4 (Deterministic Evaluation) is now also implemented and
verified: `src/evaluation/` turns a completed run into an authoritative `Outcome` using real
verification — `testSuiteVerifier` (runs the fixture's actual `npm test`) and
`diffAnalysisVerifier` (generic "did anything change" check), combined per task by
`runVerifiers()`, judged by the pure function `determineOutcomeStatus()`. The core result: the
agent's own self-reported status (`agentReportedStatus`) is never trusted for `SUCCESS`/
`TASK_FAILURE` — only verification decides, except for infra-level statuses which pass through
untouched. Proven against real fixtures both ways: a test-only agent that genuinely fixes
`debugging-01`'s bug reaches `Outcome.status: SUCCESS`; `NativeAgent` (which never fixes anything)
reaches `TASK_FAILURE` on both `debugging-01` and `refactoring-01` — the latter specifically
because its `diff-analysis` check fails even though its `test-suite` check happens to pass
(pre-refactor behavior is intact). Full detail in [[phases/phase-04]] and ADR-008 in
[[14-decisions]].

## What is NOT done

27 of the 30 tasks have no fixture source code yet (tracked backlog, see [[20-next-actions]], not
a defect) — `feature-01` has fixture source code but has not yet been run through
`executeEvaluatedRun()` in a test. Only 2 of the 9 `verificationMethod` enum values have a real
verifier (`test-suite`, `diff-analysis`); the other 7 (`static-analysis`, `repository-invariant`,
`acceptance-criteria-check`, `security-check`, `architecture-check`, `human-review`, `llm-judge`)
are interface-only until a fixture actually needs one. No metrics logic, no real solving agent, no
ECC adapter, no CLI, no container/process-level sandboxing (isolation is filesystem-copy only, and
`testSuiteVerifier` now spawns real child processes with only a wall-clock timeout, no CPU/memory
limits — see the open risk in [[16-risks]]). Do not assume any of these exist without checking
`implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 4 completion was reported to the user and
Phase 5 (Metrics) has NOT started. Do not begin Phase 5 work without an explicit new approval
message from the user, even if this file is being read in a fresh session — see
[[20-next-actions]] and [[00-project-charter]] §Working protocol. Phase 5's first job is defining
and computing primary/secondary metrics (see [[08-metrics]]) from the `Outcome`/`Verification`/
`Evidence`/`Trace` records Phase 4 now produces, and populating the existing `Metric` schema with
real values.

## Process reminders for whoever (human or agent) picks this up

- Read the memory bank before source code (this file, then [[18-current-state]] and
  [[19-phase-status]]) — it's kept deliberately more token-efficient than re-deriving state
  from the repo.
- Keep source files under ~300 lines; the `src/domain/`, `src/benchmark/`, `src/harness/`, and
  `src/evaluation/` layout (one small file per concern) is the pattern to continue.
- Update this file and `implementation-status.md` at the end of any major feature, not only at
  phase boundaries — that's what keeps this file trustworthy as a save state.
- Never commit or push without the user explicitly asking, per the environment's Git Safety
  Protocol.
- Fixture authoring convention (ADR-007): to add a real fixture, build it in a scratch location,
  `git commit` it there to mint a real SHA, then copy only the resulting working tree (no
  `.git`) into `benchmark/fixtures/<id>/` and update that task's `repository.commitSha` — never
  `git init` directly inside `benchmark/fixtures/<id>/` (creates a nested-repo "gitlink").
- New verifier convention (ADR-008): to add support for another `verificationMethod` keyword,
  implement the `Verifier` interface in a new file under `src/evaluation/verifiers/` (see
  `testSuiteVerifier.ts`/`diffAnalysisVerifier.ts` as templates) and register it in
  `verifiers/index.ts`'s `ALL_VERIFIERS` array — no other code needs to change.
- Outcome authority convention (ADR-008): never let an agent's own `SUCCESS` self-report become
  `Outcome.status` directly — only `determineOutcomeStatus()` (fed by real verification results)
  may set it, except for the infra-level statuses which originate in the harness itself.
