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
