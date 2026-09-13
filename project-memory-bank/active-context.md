# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation) through Phase 4 (Deterministic Evaluation) are complete. Phase 5 (Metrics)
is now also implemented and verified: `src/metrics/computeRunMetrics()` turns a completed,
evaluated run (Run/Trace/Outcome/Verification/Evidence/ContextArtifact) into an array of
schema-valid `Metric` records — all 5 primary metrics (`task-success`, `engineering-quality`,
`time-to-correct-outcome`, `context-efficiency`, `human-intervention`) plus 9 of 17 secondary
metrics. The remaining 8 secondary metrics (evidence recall/precision/authority/freshness,
context-redundancy, regression-rate, risk-classification, decision-confidence) are deliberately
NOT computed — each needs a data source (curated evidence ground-truth, a risk/confidence field,
cross-run history) that does not exist yet, rather than being approximated with a fabricated
value. Two implemented primary metrics are documented proxies, not their literal
[[08-metrics]] definitions: `engineering-quality` = fraction of executed verifications that
passed (until static-analysis/security-check/architecture-check verifiers exist);
`context-efficiency` = task-success per 1000 context tokens (until a real curated ContextProvider
in Phase 6 gives "usefulness" a ground truth to compare against). A lightweight, explicitly
non-statistical `aggregateMetricsByName()` (mean/median/sample-stddev) previews — but does not
pre-empt — Phase 7's full repeated-run analysis. Full detail in [[phases/phase-05]] and ADR-009
in [[14-decisions]].

## What is NOT done

27 of 30 tasks have no fixture source code yet (tracked backlog, see [[20-next-actions]]). Only 2
of 9 `verificationMethod` enum values have a real verifier (`test-suite`, `diff-analysis`). 8 of
22 named metrics have no real data source yet (ADR-009). No metric/artifact persistence to disk
(everything Phases 3-5 produce is computed in-memory and returned to the caller — there is no CLI
or storage layer yet). No real solving agent, no ECC adapter, no container/process-level
sandboxing (isolation is filesystem-copy only; `testSuiteVerifier` spawns real child processes
with only a wall-clock timeout — see the open risk in [[16-risks]]). Do not assume any of these
exist without checking `implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, Phase 5 completion was reported to the user and
Phase 6 (ECC Integration) has NOT started. Do not begin Phase 6 work without an explicit new
approval message from the user, even if this file is being read in a fresh session — see
[[20-next-actions]] and [[00-project-charter]] §Working protocol. Phase 6's first job is a real
`ContextProvider` backed by ECC (via the existing interface only, never a direct import of ECC
internals) and a real solving agent, so Conditions A-D in [[09-experiment-strategy]] can actually
be compared.

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
