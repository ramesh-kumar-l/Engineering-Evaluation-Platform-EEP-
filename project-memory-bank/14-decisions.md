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
