# 14 — Architectural Decision Records

Format: Decision / Context / Options / Chosen approach / Reason / Trade-offs / Consequences / Status.

## ADR-001: EEP is a separate repository from ECC

- **Context:** ECC is an existing, working system. EEP evaluates it.
- **Options:** (a) monorepo with ECC, (b) separate repository integrating via interfaces.
- **Chosen approach:** (b) separate repository.
- **Reason:** Master system prompt hard constraint — EEP must remain evaluation-independent and
  never risk coupling to or modifying ECC internals.
- **Trade-offs:** Slightly more integration friction (no shared build/tooling); accepted
  deliberately.
- **Consequences:** All ECC integration goes through a `ContextProvider` contract, never direct
  imports. See [[00-project-charter]], [[04-architecture]].
- **Status:** Accepted, permanent.

## ADR-002: TypeScript on Node.js as the implementation stack

- **Context:** Phase 0 needed a language/runtime choice before any scaffolding could be written.
- **Options considered:** Python (strong stats/data ecosystem, pydantic, pytest), TypeScript/Node
  (strong JSON/schema tooling, CLI ergonomics, likely alignment with agent/ECC tooling), Go
  (single-binary CLI, strong concurrency, weaker stats ecosystem).
- **Chosen approach:** TypeScript on Node.js (>=20), ESM, strict mode.
- **Reason:** User's explicit choice. The evaluation domain is JSON/schema-artifact-heavy
  (Tasks, Runs, Traces, Reports), which TypeScript's type system and ecosystem (Zod, etc.) suits
  well; one language across CLI, adapters, and a future dashboard reduces context-switching.
- **Trade-offs:** Statistical/ablation analysis (Phase 7-8) has a smaller native ecosystem than
  Python's; will rely on well-tested small libraries or hand-rolled statistics with unit tests
  rather than assuming a mature stats stack.
- **Consequences:** All future phases' code is TypeScript; schemas (Phase 1) will likely use Zod
  or a similar runtime-validated approach so schemas double as both compile-time types and
  runtime validators.
- **Status:** Accepted.

## ADR-003: Vitest as the test runner

- **Context:** Needed a TypeScript-native test runner for Phase 0 scaffolding onward.
- **Options considered:** Jest (+ ts-jest), Node's built-in test runner, Vitest.
- **Chosen approach:** Vitest.
- **Reason:** Native ESM/TypeScript support without a separate transpilation config; fast; good
  DX; widely adopted in the current TS ecosystem.
- **Trade-offs:** Slightly less battle-tested than Jest in very large codebases; not a concern at
  current project scale.
- **Status:** Accepted.

## ADR-004: Local-first, no database/queue/service infrastructure initially

- **Context:** Master prompt §54/§60 explicitly warns against premature infrastructure.
- **Chosen approach:** Evaluation artifacts are files on disk (JSON/JSONL/CSV/Markdown/HTML); no
  database, message queue, or microservices until a real requirement demonstrates the need.
- **Reason:** Matches the "scientific instrument first" objective and local-first principle;
  avoids infrastructure complexity before the data model/metrics are validated.
- **Status:** Accepted; revisit only when a concrete Phase 9+ requirement demands it.

## ADR-005: Zod for schemas, semver literal field for versioning

- **Context:** Phase 1 (Evaluation Contract) needed a concrete way to define the 14 domain
  entities ([[05-domain-model]]) as both compile-time types and runtime validators, plus a
  versioning convention satisfying NFR6 (independent versioning per schema).
- **Options considered:** hand-written TS interfaces + manual runtime checks; io-ts; Zod.
- **Chosen approach:** Zod schemas as the single source of truth; each entity module exports a
  `<ENTITY>_SCHEMA_VERSION` constant and embeds it as a `z.literal(...)` `schemaVersion` field on
  the schema itself, so every serialized artifact self-describes the schema version it was
  written against. Entity IDs are compile-time-branded strings (e.g. `TaskId` vs `RunId` cannot
  be substituted for each other) via a small local `brandedId()` helper, not Zod's built-in
  `.brand()`, to stay resilient to Zod major-version API changes.
- **Reason:** Zod gives one definition for both static types (`z.infer`) and runtime validation,
  which the JSON/artifact-heavy domain model needs; the memory-bank `schemas/*.md` stubs
  explicitly deferred concrete schema choice to this phase.
- **Trade-offs:** All future contributors must know Zod; schema files sit above the file-size
  norm for trivial entities only in the sense that each carries its own version constant and
  doc-comment, not extra logic.
- **Consequences:** `project-memory-bank/schemas/*.md` files are now thin pointers to
  `src/domain/**/*.schema.ts` rather than duplicated specs, to avoid drift (memory-bank
  token-efficiency rule). A breaking field change bumps the relevant `*_SCHEMA_VERSION` and gets
  a new ADR entry or an addendum here.
- **Status:** Accepted.

## ADR-006: Self-hosted benchmark fixtures, one JSON task file per task

- **Context:** Phase 2 (Benchmark V1) needed to decide where the 30 `Task` records
  ([[07-benchmark-strategy]]) live on disk, and what `repository` (url + commitSha) should point
  to for each — `taskSchema` requires both fields non-empty.
- **Options considered:** (a) real external GitHub repositories pinned by a real commit SHA
  (SWE-bench style); (b) self-hosted fixture repositories versioned inside EEP itself under
  `benchmark/fixtures/<id>/`; (c) one giant tasks.json array vs. one file per task.
- **Chosen approach:** (b) self-hosted fixtures, path convention `benchmark/fixtures/<id>/`; (c)
  one JSON file per task under `benchmark/tasks/<id>.json`, loaded/validated by
  `src/benchmark/loadTasks.ts` against `taskSchema`. Every Phase 2 task record uses the sentinel
  `repository.commitSha: "unpinned"` — actual fixture source code and a real pinned SHA are
  deferred to Phase 3 (Experiment Harness), which owns "environment isolation" per
  [[13-roadmap]]; Phase 2's job is the task *contract* (title, description, category, complexity,
  acceptance criteria, verification method, ground truth), not a runnable checkout.
- **Reason:** External repos risk contamination (well-known code may be in agent training data —
  directly against the "avoid benchmark contamination" quality rule), risk drift/unavailability
  over time (breaks reproducibility), and require network access (against the local-first
  principle in [[04-architecture]]). Self-hosted fixtures keep EEP in full control of history and
  are fully offline. One-file-per-task keeps each file small (strict modularity) and diff-friendly
  in code review, versus one large array file.
- **Trade-offs:** EEP must author and maintain its own small fixture codebases rather than reusing
  real-world repositories; fixture realism is bounded by what EEP authors, not sampled from
  production code. Accepted as appropriate for a controlled, reproducible V1 benchmark.
- **Consequences:** `"unpinned"` in `repository.commitSha` is a documented Phase 2/3 boundary
  marker, not a defect — see [[07-benchmark-strategy]] §Benchmark structure. Phase 3 must replace
  it with a real commit SHA once each fixture's source code is authored and committed.
- **Status:** Accepted.

## ADR-007: Phase 3 environment isolation, fixture commit-SHA method, and two small interface fixes

- **Context:** Phase 3 (Experiment Harness) needed to implement real environment isolation, a
  concrete `Agent`/`ContextProvider` pair, and — per ADR-006 — replace the `"unpinned"` sentinel
  with a real `commitSha` for at least a proof set of fixtures.
- **Options considered (isolation):** (a) container-based sandboxing (Docker), (b) OS-level
  process sandboxing, (c) filesystem-level isolation — copy the fixture into a disposable temp
  directory before an agent ever touches it.
- **Chosen approach (isolation):** (c). `src/harness/workspace.ts`'s `createIsolatedWorkspace()`
  copies a fixture into a fresh `os.tmpdir()` directory (excluding any `.git`) and returns a
  `cleanup()` that removes it; every `Agent`/`ContextProvider` call receives only the sandbox
  path, never the canonical fixture path.
- **Reason (isolation):** Matches the local-first stance (ADR-004) — no new infrastructure
  dependency (Docker) before a concrete need (e.g. running untrusted agent-generated code)
  demonstrates it. Filesystem isolation is sufficient to guarantee a run can never mutate
  `benchmark/fixtures/` and is trivially reproducible on any contributor's machine.
- **Trade-offs (isolation):** Does not sandbox CPU/memory/network or protect against a malicious
  agent executing arbitrary commands — acceptable now because Phase 3's agents (native
  exploration only) don't execute fixture code; revisit before any agent that runs untrusted
  generated commands (flagged in [[16-risks]]).
- **Options considered (commit SHA):** (a) `git init` directly inside
  `benchmark/fixtures/<id>/`, committed as part of the main EEP repo; (b) build each fixture in a
  scratch location, `git commit` it there to obtain a real SHA, then copy only the resulting
  working tree (no `.git`) into `benchmark/fixtures/<id>/`.
- **Chosen approach (commit SHA):** (b). `debugging-01`, `feature-01`, and `refactoring-01` were
  authored this way; their `repository.commitSha` is now a real git commit SHA
  (`f3518a14...`, `ab3a1260...`, `78e0541a...` respectively), computed by an actual `git commit`
  against that fixture's own content, not fabricated.
- **Reason (commit SHA):** (a) would embed a nested `.git` directory inside the main repository's
  tree, which Git treats as an embedded-repository "gitlink" — `git add` in the parent repo
  would then track only a commit pointer for that directory instead of its files, silently
  breaking the one-file-per-task / diff-friendly fixture convention from ADR-006. (b) yields an
  equally real, verifiable commit SHA without that footgun.
- **Trade-offs (commit SHA):** The ephemeral git repo used to mint the SHA is not itself
  preserved in EEP's history — only its resulting file tree and the SHA recorded on the task are.
  This is acceptable: reproducibility requires the pinned *content* to be stable and inspectable
  (it is, under `benchmark/fixtures/<id>/`), not a replayable git history of how it was authored.
- **Consequences (commit SHA):** Per the "representative subset" scope agreed with the user for
  this phase, only 3 of the 30 tasks were converted from `"unpinned"` to a real `commitSha` in
  Phase 3; the remaining 27 stay `"unpinned"` and are explicit backlog (see [[20-next-actions]]),
  to be picked up incrementally — most urgently by whichever task Phase 4 (Deterministic
  Evaluation) first needs to actually execute verification against.
- **Interface fixes:** Implementing the first real `Agent`/`ContextProvider` adapters surfaced two
  gaps in the Phase 1 interfaces (`src/domain/providers/agent.ts`,
  `src/domain/providers/context-provider.ts`), neither of which had an implementation yet to
  break: (1) `AgentRunRequest` and `ContextProviderRequest` gained a required `runId: RunId` field
  — without it, an adapter has no way to stamp a schema-valid, correctly-linked `Action`,
  `Decision`, or `ContextArtifact` (all of which require `runId`). (2) `traceSchema` gained an
  optional `agentReportedStatus: RunStatus` field — the agent's own self-reported completion
  signal, captured for provenance; it is never authoritative (only a Verification-backed
  `Outcome.status`, Phase 4, is) and defaults to absent for backward compatibility, so no
  `TRACE_SCHEMA_VERSION` bump was needed.
- **Status:** Accepted.

## ADR-008: Verification as a pluggable, text-triggered checker registry; Outcome.status always overrides agentReportedStatus

- **Context:** Phase 4 (Deterministic Evaluation) needed to turn a Trace into an authoritative
  `Outcome`, using `task.verificationMethod` (a free-text field like `"test-suite: run the
  pagination tests."` or `"diff-analysis: confirm duplication removed, combined with a
  test-suite run."`) to decide which checks to run, and needed a single rule for combining
  possibly-conflicting signals (the agent's own self-report vs. what verification actually found)
  into one `RunStatus`.
- **Options considered (verifier selection):** (a) a rigid enum-to-verifier 1:1 mapping requiring
  every task's `verificationMethod` to name exactly one method; (b) a small `Verifier` interface
  (`appliesTo(task)` + `run(context)`) with a registry (`ALL_VERIFIERS`), where each verifier
  text-matches its own keyword against `verificationMethod` and multiple verifiers may apply to
  one task.
- **Chosen approach (verifier selection):** (b). `src/evaluation/verifiers/`: `testSuiteVerifier`
  (spawns the fixture's own `npm test`, no shell-injection risk since the command is fixed and
  never built from task/agent-controlled input) and `diffAnalysisVerifier` (generic structural
  check: did any file actually change relative to the pristine fixture — necessary-but-not-
  sufficient evidence, catches "explored and claimed success without changing anything"). A
  verifier that cannot run at all (missing test script, unreadable fixture) throws
  `VerificationExecutionError`/`VerificationTimeoutError` rather than returning a fabricated
  `passed: false`, so "evaluation unavailable" is never silently reported as "evaluation failed."
- **Reason (verifier selection):** Matches
  project-memory-bank/06-evaluation-methodology.md §Multi-evidence outcome evaluation ("prefer
  combining, where available") — `refactoring-01`'s verificationMethod names both `diff-analysis`
  and `test-suite`, and both genuinely run and get combined into one Outcome.
- **Options considered (status combination):** (a) trust `agentReportedStatus` when it says
  `SUCCESS` and only fall back to verification on `INCOMPLETE`; (b) `agentReportedStatus` governs
  only the infra-level statuses (`ENVIRONMENT_FAILURE`, `AGENT_FAILURE`, `TIMEOUT`) — for every
  other case, verification alone decides `SUCCESS` vs. `TASK_FAILURE`, and an empty verification
  result is `EVALUATION_FAILURE`.
- **Chosen approach (status combination):** (b), implemented as the pure function
  `determineOutcomeStatus()` in `src/evaluation/determineOutcome.ts`.
- **Reason (status combination):** This is the entire point of Phase 4 per
  [[schemas/trace-schema]] and ADR-007's interface-fix note: an agent claiming `SUCCESS` does not
  mean the work is correct. Trusting the self-report for `SUCCESS` would make `Outcome.status`
  redundant with `agentReportedStatus` and defeat the purpose of building verification at all.
  Proven concretely by two fixtures under test: `debugging-01` run by a test-only agent that
  writes a genuine fix reports `agentReportedStatus: SUCCESS` and independently verifies to
  `Outcome.status: SUCCESS`; `refactoring-01` run by `NativeAgent` has its `test-suite` check pass
  (pre-refactor behavior is intact) but its `diff-analysis` check fail (nothing was actually
  changed), correctly yielding `TASK_FAILURE` overall — multi-evidence combination doing exactly
  the job the methodology describes.
- **Trade-offs:** `diffAnalysisVerifier`'s "did anything change" check is a coarse, task-agnostic
  signal — it cannot tell a correct refactor from a destructive one; it only rules out "no attempt
  was made." Finer-grained diff analysis (e.g., "duplication actually removed") would need
  task-specific assertions, deferred until a concrete need arises.
- **Consequences:** `src/harness/runHarness.ts` gained one small, backward-compatible extension
  point (`HarnessDependencies.onBeforeCleanup`, optional) so verification can run against the
  agent-modified workspace before it is cleaned up, without `executeRun()`/Phase 3 tests knowing
  anything about `Verification`/`Outcome`. Contract: the hook must never throw (a throw would be
  indistinguishable from `AGENT_FAILURE`); `src/evaluation/evaluateRun.ts`'s hook guarantees this
  by construction (`runVerifiers()` catches every verifier's errors internally).
- **Status:** Accepted.

## ADR-009: Metrics computed only where a real data source exists; single-run definition before multi-run aggregation

- **Context:** Phase 5 (Metrics) needed to populate the `Metric` schema with real values for the 5
  primary + 17 secondary metric names named in [[08-metrics]], computed from the
  `Run`/`Trace`/`Outcome`/`Verification`/`Evidence`/`ContextArtifact` records Phases 3-4 produce,
  and to decide how metrics aggregate across repeated runs of the same Task×Condition pair ahead
  of Phase 7's full statistical rigor.
- **Options considered (coverage):** (a) implement all 22 named metrics now, approximating the
  ones with no real data source (e.g. `evidence-recall` with no ground-truth evidence set,
  `risk-classification` with no risk field on `Task`); (b) implement only the metrics honestly
  computable from data that already exists, and explicitly document the rest as not-yet-computable
  rather than fabricating a placeholder value.
- **Chosen approach (coverage):** (b). 14 of 22 metrics are implemented — all 5 primary
  (`task-success`, `engineering-quality`, `time-to-correct-outcome`, `context-efficiency`,
  `human-intervention`) and 9 secondary (`context-tokens`, `tool-calls`, `agent-turns`,
  `files-read`, `files-changed`, `retries`, `failed-attempts`, `provenance-completeness`,
  `verification-completeness`). `evidence-recall`, `evidence-precision`, `evidence-authority`,
  `evidence-freshness`, `context-redundancy`, `regression-rate`, `risk-classification`, and
  `decision-confidence` are not computed — each needs a data source (a curated "required evidence"
  set, a source-authority model, cross-run history, a `Task.risk` field, a `Decision.confidence`
  field) that does not exist yet.
- **Reason (coverage):** Fabricating a value for a metric with no real basis would silently
  misrepresent the system under test — the same integrity principle already governing
  [[00-project-charter]] and ADR-008's "throw rather than report a false negative" rule. Two
  metrics needed an honest proxy rather than their literal memory-bank definition, and that
  substitution is documented in code, not hidden: `engineering-quality` (full definition needs
  static-analysis/security-check/architecture-check verifiers that don't exist yet — Phase 5
  computes it as "fraction of executed verifications that passed," which is real, non-fabricated
  data) and `context-efficiency` (the "usefulness" side of the ratio has no ground truth until
  ECC/Phase 6 provides curated context to compare against — Phase 5 approximates usefulness as
  "did the run succeed," expressed per 1000 context tokens).
- **Options considered (aggregation):** (a) build full statistical machinery now (confidence
  intervals, significance testing) even though Phase 5 only produces single-run data; (b) define
  and unit-test a single run's metric value correctly first, and ship only a lightweight
  mean/median/sample-stddev summarizer (`aggregateMetricsByName()`) as a preview, explicitly
  deferring real statistical rigor to Phase 7 (Experimental Analysis).
- **Chosen approach (aggregation):** (b). `src/metrics/aggregateMetrics.ts` groups a list of
  `Metric` records by `name` and reports count/mean/median/sample-stddev; it does not know about
  Task/Condition identity (a `Metric` only carries `runId`) and performs no significance testing —
  callers are responsible for only passing metrics from the same Task×Condition pair.
- **Reason (aggregation):** [[13-roadmap]] scopes "aggregation" into Phase 5 and "repeated runs"/
  full analysis into Phase 7 separately; building rigorous statistics before there is more than a
  handful of real repeated runs to validate against would be premature infrastructure, the same
  anti-pattern ADR-004 already rejects.
- **Trade-offs:** The 8 unimplemented secondary metrics remain enum-only (matching the same
  pattern ADR-008 already established for unimplemented `Verifier` methods); a reader of
  [[08-metrics]] alone (without also reading [[implementation-status]]) could mistakenly assume
  all 22 are live.
- **Consequences:** `src/harness/runHarness.ts`'s `HarnessRunOutcome` gained an additive, optional
  `contextArtifact` field (the full `ContextArtifact`, not just its id) and
  `src/evaluation/evaluateRun.ts`'s `EvaluatedRunOutcome` gained an additive `executionErrors`
  field — both were already computed internally and discarded; Phase 5's `context-tokens`/
  `context-efficiency` and `verification-completeness` metrics need them. Neither change altered
  any existing field, and all pre-existing Phase 3/4 tests passed unchanged. Adding a metric for a
  now-existing data source later is a new file under `src/metrics/`, following the same
  registry-free "one function per concern" pattern as `primaryMetrics.ts`/`secondaryMetrics.ts`.
- **Status:** Accepted.

## ADR-010: ECC integration via subprocess CLI invocation, EEP owns an independent schema mirror

- **Context:** Phase 6's exit criterion is a real `ContextProvider` backed by ECC, wired through
  ECC's external interface only — never an import of ECC's internal modules — per the hard
  repository-boundary rule in [[00-project-charter]]. [[04-architecture]] left the exact
  mechanism ("likely CLI invocation or a documented artifact contract") deferred to this phase.
- **Options:** (a) CLI subprocess invocation of ECC's published `ecc` binary/`dist/cli/index.js`
  entry point, parsing its documented stdout JSON contract; (b) a filesystem artifact contract
  (ECC writes a context file, EEP reads it); (c) importing ECC's TypeScript modules directly as a
  library dependency.
- **Chosen approach:** (a) subprocess CLI invocation.
- **Reason:** ECC's own README documents exactly one stable, versioned, human-and-machine-
  readable contract for this purpose: `ecc context "<task>" --path <dir> [--budget <n>]` printing
  a validated `EngineeringContextPackage` JSON document to stdout (ECC validates its own output
  against its internal schema before printing — see ECC's `src/cli/cli.ts`). This is lower
  friction than (b) for a synchronous request/response shape, and (c) is categorically
  disallowed by the repository boundary rule regardless of friction.
- **Trade-offs:** A subprocess call is slower and has weaker type safety at the boundary than an
  in-process call would; mitigated by owning an independent Zod schema (`eccPackageSchema.ts`)
  that mirrors ECC's documented package shape and validates every invocation's output before any
  of it is trusted, so a future ECC contract change fails loudly (a `EccInvocationError`) rather
  than silently producing garbage. The invoked command is not hardcoded — `EccCliInvokerOptions`
  (`command`/`commandArgs`, defaulting to `ECC_CLI_COMMAND` env var else `"ecc"`) lets a
  deployment point at a global link or `node <checkout>/dist/cli/index.js` with zero EEP code
  changes, so this repo never bakes in another machine's absolute path.
- **Consequences:** New `src/harness/providers/ecc*.ts` (all under 300 lines):
  `eccPackageSchema.ts` (independent contract mirror), `eccCliInvoker.ts`
  (`ProcessEccCliInvoker`, array-argument `execFile` — never shell string interpolation, matching
  ECC's own documented security posture — with `EccInvocationError`/`EccTimeoutError`), and
  `eccContextProvider.ts` (`EccContextProvider implements ContextProvider`, condition B/C's real
  context source per [[09-experiment-strategy]]). The full validated package JSON becomes the
  `ContextArtifact.content`; `tokenCount` uses Phase 5's `estimateTokenCount()` since ECC's CLI
  contract does not itself report a token count. Unit tests inject a fake `EccCliInvoker` (no
  subprocess) or spawn small self-authored fake-CLI scripts (matching the ADR-007 fixture
  discipline of never depending on uncontrolled external state); one additional test
  (`eccContextProvider.realCli.test.ts`) does invoke a real sibling ECC checkout end-to-end but is
  `skipIf`-gated on that checkout existing and being built, so the suite stays green in any
  environment that only has this repo. Exit criterion scope note: this phase, as instructed,
  covers only the `ContextProvider`; a real solving agent and an actual multi-condition
  comparison run remain open next actions (roadmap Phase 6 originally scoped both together) —
  see [[phases/phase-06]] and [[20-next-actions]].
- **Status:** Accepted.
