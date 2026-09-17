# Active Context

The single "resume here cold" file — read this first, before [[18-current-state]] or any
source code, if picking this project back up after a break.

## Where things stand right now

Phase 0 (Foundation) through Phase 8 (Ablation) are complete, and Phase 6's full roadmap scope
(real solving agent + actual comparison-run mechanism) is now also closed — see below. Phase 7 is
complete in its confidence-intervals-and-effect-size scope. Phase 8 (Ablation) is implemented and
verified, scoped to per-component measurement of ECC's contribution.

**Phase 6 remainder (this session):** `src/harness/llm/` gives EEP a real, multi-provider LLM
client layer (ADR-013 in [[14-decisions]]) — `AnthropicLlmClient` (Claude) and
`OpenAiCompatibleLlmClient` (one implementation covering ChatGPT, Gemini's OpenAI-compatibility
endpoint, and any local OpenAI-compatible server, by configuration alone), assembled via
`createLlmClient(config)` with no hardcoded default vendor. `LlmSolvingAgent`
(`src/harness/agents/llmSolvingAgent.ts`) is the real solving agent: a bounded tool loop
(`list_files`/`read_file`/`write_file`, all path-clamped to the workspace root, plus `run_tests` —
no generic shell-exec) that pairs with *any* `ContextProvider`. Critically, it runs under **every**
condition in the real comparison, including the native baseline — not just the ECC condition —
correcting an earlier design note that would have kept the old, always-`INCOMPLETE`, never-edits-
code `NativeAgent` as the baseline while only ECC got a real agent (a variable-conflation bug
matching the "Baseline weakness" risk, now Mitigated in [[16-risks]]). `src/experiments/`
(`runComparisonExperiment.ts` + `analyzeComparisonResults.ts`) runs the actual 9-condition × 3-task
× 3-repetition comparison through `executeEvaluatedRun()`/`computeRunMetrics()`, dumps raw JSON per
run to a gitignored `experiment-results/`, and feeds the results into Phase 7's
`analyzeRepeatedRuns()` and Phase 8's `analyzeComponentContributions()` unchanged — the first time
either function's wiring has been exercised end-to-end (against synthetic bundles in tests; a
*live* LLM-backed run has not yet been executed — that needs the user's own credentials and a
deliberate `npm run experiment:run`). Full detail in [[phases/phase-06]] and ADR-013.
`src/harness/providers/eccAblation.ts`'s `ablatePackage()` maps each of the 7 named components
from [[06-evaluation-methodology]] §Ablation discipline (history, memory, ranking, provenance,
risk, budgeting, verification) onto a real, already-present field of ECC's documented package
contract and returns a copy with that one field removed/neutralized, holding everything else
constant. `AblatedEccContextProvider` (`ablatedEccContextProvider.ts`) wraps one component's
ablation as its own named `ContextProvider`/Condition (`ecc-ablated:<component>`) — running the
same agent against it and against the full `EccContextProvider` isolates that component's marginal
effect, the same causal-control logic [[09-experiment-strategy]] already uses for conditions.
Measurement needed no new statistics: `src/analysis/componentContribution.ts`'s
`analyzeComponentContributions()` reuses Phase 7's `analyzeRepeatedRuns()` unchanged, once per
component. Full detail in [[phases/phase-08]] and ADR-012 in [[14-decisions]].

Phase 7 recap: `src/analysis/analyzeRepeatedRuns()` (`src/analysis/groupedAnalysis.ts`) is the
repeated-run statistics entry point: given a list of `RunAnalysisRecord` (a run's already-computed
`Metric[]` paired with its condition name and task category/complexity), it produces, per
requested metric, an overall summary/comparison plus one breakdown per category and per
complexity level actually present. Confidence intervals use the Student's t-distribution for
continuous metrics (`meanConfidenceInterval`) or the Wilson score interval for the proportion
metric `task-success` (`proportionConfidenceInterval`); effect size uses Cohen's d (continuous) or
Cohen's h (proportion). All critical values are exact published table lookups, never an
approximated formula (ADR-011). A group with too few runs returns an explicit
`insufficient-data` result rather than a fabricated number or a thrown exception that would abort
the whole analysis. Full detail in [[phases/phase-07]] and ADR-011 in [[14-decisions]].

Phase 6 recap: `EccContextProvider` (`src/harness/providers/eccContextProvider.ts`) wraps ECC's
published CLI contract (`ecc context "<task>" --path <dir> [--budget <n>]`) via
`ProcessEccCliInvoker`, validated against EEP's own independent `eccPackageSchema.ts` mirror —
never an import of ECC source. Full detail in [[phases/phase-06]] and ADR-010.

Phase 5 recap: `src/metrics/computeRunMetrics()` turns a completed, evaluated run into an array of
schema-valid `Metric` records — all 5 primary metrics plus 9 of 17 secondary metrics; 8 remain
deliberately unimplemented (ADR-009). Full detail in [[phases/phase-05]].

## What is NOT done

**No live comparison run has been executed yet.** `LlmSolvingAgent` and `src/experiments/` exist
and are tested (mocked LLM responses; a synthetic-bundle wiring test for the analysis path), but
nobody has run `npm run experiment:run` against a real Claude/ChatGPT/Gemini/local-model backend —
that requires the user's own `EEP_LLM_*` credentials/server and a deliberate invocation, not
something done automatically. Until that happens, `analyzeRepeatedRuns()` and
`analyzeComponentContributions()` still have never run against *real* experiment data, only
synthetic data in tests. `Run.metadata.modelName`/`modelVersion` are also still unpopulated (see
[[20-next-actions]] item 2's note) — a small additive `runHarness.ts` change, not yet made. 27 of
30 tasks have no fixture source code yet (tracked backlog, see [[20-next-actions]]). Only 2 of 9
`verificationMethod` enum values have a real verifier (`test-suite`, `diff-analysis`). 8 of 22
named metrics have no real data source yet (ADR-009) — though ECC's per-item
relevance/trustLevel/authority/freshness data is now available inside `ContextArtifact.content` as
a future (not yet wired) source for 4 of those 8. Failure analysis (the 4th item in
[[13-roadmap]]'s Phase 7 row) was not requested and is not built. ECC's ablation is content-level
(post-hoc field removal from its CLI output), not a measurement of ECC's real internal component
architecture — see ADR-012's trade-offs and [[phases/phase-08]]'s known limitations. No
metric/artifact/analysis persistence to disk beyond the Phase 6-remainder's plain gitignored
`experiment-results/` JSON dump (everything else Phases 3-8 produce is computed in-memory and
returned to the caller — there is no CLI or storage layer yet, and `experiment-results/` is
explicitly not Phase 9's canonical format). No container/process-level sandboxing (isolation is
filesystem-copy only; `testSuiteVerifier` and the solving agent's `run_tests` tool both spawn real
child processes with only a wall-clock timeout — narrowed but not closed, see [[16-risks]]). Do not
assume any of these exist without checking `implementation-status.md` first.

## Immediate next step

Per the master prompt's strict phase gate, this Phase 6-remainder work's completion is reported to
the user and no further Phase 7/8/9 work or live run has started. Do not begin further work,
and do not execute a live comparison run, without an explicit new approval message from the user,
even if this file is being read in a fresh session — see [[20-next-actions]] and
[[00-project-charter]] §Working protocol. The next open items are: executing a live comparison run
(needs the user's own LLM credentials and an explicit go-ahead), failure analysis (Phase 7's
roadmap remainder), or Phase 9 (Reporting).

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
- Statistics convention (ADR-011): only 90%/95%/99% confidence levels are supported, backed by
  exact published t-table/z-critical values (`src/analysis/tDistribution.ts`) — never add a new
  confidence level without also adding its exact critical values, and never replace the table with
  an approximated inverse-distribution formula. Low-level functions
  (`meanConfidenceInterval`/`cohensD`/etc.) throw `InsufficientSampleSizeError` when misused
  directly; orchestration code (`repeatedRunAnalysis.ts`/`groupedAnalysis.ts`) must catch that by
  checking sample size upfront and returning a `status: 'insufficient-data'` result instead of
  letting one underpowered group crash the whole analysis.
- Ablation convention (ADR-012): a new ablatable component must map onto a real, already-present
  field of ECC's documented package contract (`eccPackageSchema.ts`) — never invent a dimension
  ECC doesn't actually report. Add it to `ECC_ABLATION_COMPONENTS`/`ablatePackage()` in
  `src/harness/providers/eccAblation.ts`; `AblatedEccContextProvider` and
  `analyzeComponentContributions()` need no changes to support a new component. Never add new
  statistics for ablation measurement — it reuses `analyzeRepeatedRuns()` (Phase 7) because an
  ablation comparison is structurally just another condition-vs-baseline comparison.
- LLM solving-agent convention (ADR-013): `LlmSolvingAgent` must run under *every* condition in
  the real comparison, including the native baseline — never let `NativeAgent` stand in as "the
  baseline agent" in a real comparison run, since that would conflate agent capability with
  context quality (the one thing [[09-experiment-strategy]] says must be the only varying
  dimension). To add a 5th LLM backend, add a new `src/harness/llm/*LlmClient.ts` implementing the
  shared `LlmClient` interface — never hardcode a default provider in `createLlmClient.ts`; new
  provider config always comes from an explicit `LlmProviderConfig` value. The agent's tool
  surface (`llmAgentTools.ts`) stays deliberately narrow — never add a generic shell-exec tool;
  every new filesystem tool must resolve its path argument through `resolveWorkspacePath()` (or
  equivalent) and reject anything that escapes the workspace root, since tool-call arguments come
  from model output and are untrusted input.
