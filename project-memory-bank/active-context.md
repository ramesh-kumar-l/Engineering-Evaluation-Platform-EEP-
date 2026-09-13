# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation) through Phase 5 (Metrics) are complete. Phase 6 (ECC Integration) is now
also implemented and verified, scoped to this round's exact exit criterion: a real
`ContextProvider` wrapping ECC via its external interface only. `EccContextProvider`
(`src/harness/providers/eccContextProvider.ts`) shells out to ECC's own published CLI contract
(`ecc context "<task>" --path <dir> [--budget <n>]`, documented in ECC's README) via
`ProcessEccCliInvoker` — array-argument `execFile`, no shell string interpolation, fully
configurable command/args so no absolute path to any machine's ECC checkout is hardcoded. Every
invocation's stdout is parsed and validated against `eccPackageSchema.ts`, EEP's own independent
Zod mirror of ECC's documented `EngineeringContextPackage` shape — EEP never imports ECC source,
per the repository boundary rule. Proven against a real sibling ECC checkout end-to-end
(`eccContextProvider.realCli.test.ts`, `skipIf`-gated so it passes-by-skipping when that checkout
isn't present). Full detail in [[phases/phase-06]] and ADR-010 in [[14-decisions]].

Phase 5 recap: `src/metrics/computeRunMetrics()` turns a completed, evaluated run into an array of
schema-valid `Metric` records — all 5 primary metrics plus 9 of 17 secondary metrics; 8 remain
deliberately unimplemented (ADR-009). Full detail in [[phases/phase-05]].

## What is NOT done

No real solving agent yet — `NativeContextProvider`/`NativeAgent` (no context) and
`EccContextProvider` (real curated context) both exist, but nothing plays Condition B/C's "does
real work" agent role yet, so no actual native-vs-ECC comparison run has happened. 27 of 30 tasks
have no fixture source code yet (tracked backlog, see [[20-next-actions]]). Only 2 of 9
`verificationMethod` enum values have a real verifier (`test-suite`, `diff-analysis`). 8 of 22
named metrics have no real data source yet (ADR-009) — though ECC's per-item
relevance/trustLevel/authority/freshness data is now available inside `ContextArtifact.content`
as a future (not yet wired) source for 4 of those 8. No metric/artifact persistence to disk
(everything Phases 3-6 produce is computed in-memory and returned to the caller — there is no CLI
or storage layer yet). No container/process-level sandboxing (isolation is filesystem-copy only;
`testSuiteVerifier` spawns real child processes with only a wall-clock timeout — see the open risk
in [[16-risks]]). Do not assume any of these exist without checking `implementation-status.md`
first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 6 (this round's scope) completion was reported
to the user and no further Phase 6/7 work has started. Do not begin further work without an
explicit new approval message from the user, even if this file is being read in a fresh session —
see [[20-next-actions]] and [[00-project-charter]] §Working protocol. The next open items are a
real solving agent for Condition B/C and an actual multi-condition comparison run wiring
Conditions A-D in [[09-experiment-strategy]] to the now-real providers.

## Process reminders for whoever (human or agent) picks this up

- Read the memory bank before source code (this file, then [[18-current-state]] and
  [[19-phase-status]]) — it's kept deliberately more token-efficient than re-deriving state
  from the repo.
- Keep source files under ~300 lines; the `src/domain/`, `src/benchmark/`, `src/harness/`,
  `src/evaluation/`, and `src/metrics/` layout (one small file per concern) is the pattern to
  continue.
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
- New metric convention (ADR-009): only add a metric's real computation once a genuine data
  source exists for it — never approximate a named metric with a fabricated/placeholder value.
  Add it as a small function in `primaryMetrics.ts`/`secondaryMetrics.ts` (or a new file if it
  needs its own data-gathering logic), sourced from `RunMetricsInput` in `metricsInput.ts`.
- ECC integration convention (ADR-010): EEP talks to ECC only through its documented CLI
  contract (`src/harness/providers/eccCliInvoker.ts`/`eccContextProvider.ts`) — never import ECC
  source, and never hardcode a filesystem path to any specific ECC checkout; the invoked
  command/args are always constructor-/env-configurable. If ECC's package contract changes,
  update the independent mirror in `eccPackageSchema.ts`, not by importing ECC's own schema.
