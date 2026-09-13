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
