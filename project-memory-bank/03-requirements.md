# 03 — Requirements

Status: living draft, established in Phase 0, to be refined as each phase's actual scope is
implemented. Not a frozen spec.

## Functional requirements (target state, built incrementally)

- FR1: Support a canonical `Task` model sufficient to reproduce an evaluation (see
  [[schemas/task-schema]]).
- FR2: Support an `Experiment` model composing Task + repository state + agent + model + context
  provider + tools + environment + configuration + evaluation version ([[schemas/experiment-schema]]).
- FR3: Support pluggable `ContextProvider` implementations (native/no-op, ECC, oracle, future
  providers) behind one contract — see [[04-architecture]].
- FR4: Capture a full `Trace` of the engineering interaction lifecycle (context → agent actions →
  tool calls → files read/changed → commands → tests → retries → verification → outcome) with
  configurable redaction — [[schemas/trace-schema]].
- FR5: Evaluate outcomes using multiple evidence sources (tests, static analysis, diff analysis,
  repository invariants, acceptance criteria, security checks, architecture checks, optional
  human/LLM-judge review), always distinguishing "tests pass" from "engineering outcome correct"
  — see [[06-evaluation-methodology]].
- FR6: Compute the primary and secondary metrics defined in [[08-metrics]] per run and aggregate
  per experiment/condition.
- FR7: Produce machine-readable artifacts (JSON/JSONL/CSV) and human-readable reports
  (Markdown/HTML) from one canonical result schema — no duplicated evaluation logic in a
  dashboard layer.
- FR8: Provide a CLI as the primary interface (`eep benchmark`, `eep experiment`, `eep compare`,
  `eep analyze`, `eep report`, and eventually `eep prove`) — see [[13-roadmap]] Phase 3+.
- FR9: Record full reproducibility metadata on every run — see [[10-reproducibility]].
- FR10: Support an initial benchmark of ~30 tasks across defined categories/complexity levels —
  see [[07-benchmark-strategy]].

## Non-functional requirements

- NFR1 (Independence): EEP must never become coupled to ECC internals; ECC is exchangeable for
  any other `ContextProvider`.
- NFR2 (Reproducibility): every meaningful result must be reproducible from recorded metadata.
- NFR3 (Local-first): the first usable version runs entirely locally, no required external
  services, no database, no message queue.
- NFR4 (Security/privacy): no source code leaves the local machine unless explicitly configured;
  safe subprocess execution; configurable redaction — see [[11-security]].
- NFR5 (Explicit uncertainty/failure): failures are never silently reclassified (e.g. an
  infrastructure failure must never be reported as a task/agent failure) — see [[06-evaluation-methodology]].
- NFR6 (Versioning): EEP, benchmark, evaluator, metrics, schemas, experiments, and reports are
  each versioned independently — see [[10-reproducibility]] and [[14-decisions]].
- NFR7 (Extensibility): a new agent or context provider can be added without modifying core
  evaluation logic.
- NFR8 (Maintainability): no unjustified abstractions; scope discipline per task (master prompt
  §68); TypeScript strict mode, linted, tested.
- NFR9 (Immutability): a finalized run's evaluation result is not silently mutated; corrections
  are tracked alongside the original with new evaluator version metadata.

## Out of scope for the foreseeable future

See [[02-product-vision]] §Explicitly deferred and [[13-roadmap]] for phase sequencing.
