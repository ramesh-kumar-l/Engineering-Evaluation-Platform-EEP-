# Phase 4 — Deterministic Evaluation

## Objective

Per [[13-roadmap]]: verification logic that turns a Trace into an Outcome using
tests/static-analysis/diff-analysis, correctly using the full `RunStatus` taxonomy.

## Implemented

- **Verifier framework** — `src/evaluation/verifiers/verifier.types.ts`'s `Verifier` interface
  (`appliesTo(task)` + `run(context)`), plus `VerificationExecutionError`/
  `VerificationTimeoutError` to distinguish "the check could not run" from "the check ran and
  found the task unsolved" — the same distinction the failure taxonomy in
  [[06-evaluation-methodology]] requires.
- **`testSuiteVerifier`** (`src/evaluation/verifiers/testSuiteVerifier.ts`) — runs the fixture's
  own `npm test` inside the (possibly agent-modified) isolated workspace, captures stdout/stderr
  as `Evidence` (kind `test-result`), and reports `passed` from the real exit code. Throws
  `VerificationExecutionError` if the fixture has no runnable test script, and
  `VerificationTimeoutError` if the process exceeds its time budget (15s default), rather than
  reporting a false negative.
- **`diffAnalysisVerifier`** (`src/evaluation/verifiers/diffAnalysisVerifier.ts`) — generic,
  task-independent structural check comparing every file in the workspace against the pristine
  fixture; `passed` is true only if at least one file actually changed. Catches "the agent
  explored and claimed success without changing anything."
- **`runVerifiers()`** (`src/evaluation/runVerifiers.ts`) — runs every verifier whose `appliesTo`
  matches the task's free-text `verificationMethod`, collecting successes and execution errors
  separately without ever throwing — implements the "combine multiple evidence sources" guidance
  in [[06-evaluation-methodology]].
- **`determineOutcomeStatus()`** (`src/evaluation/determineOutcome.ts`) — the single, pure,
  exhaustively unit-tested authority turning `(agentReportedStatus, verification results)` into
  one `RunStatus`. Rule: infra-level self-reports (`ENVIRONMENT_FAILURE`/`AGENT_FAILURE`/
  `TIMEOUT`) pass through untouched; a verifier timeout escalates to `TIMEOUT`; zero executed
  verifications is `EVALUATION_FAILURE`; otherwise verification alone decides `SUCCESS` vs.
  `TASK_FAILURE` — the agent's own `SUCCESS`/`INCOMPLETE` self-report is never trusted. See
  ADR-008 in [[14-decisions]].
- **`executeEvaluatedRun()`** (`src/evaluation/evaluateRun.ts`) — the Phase 4 entry point: runs a
  Task exactly as Phase 3's `executeRun()` does, then (via a new, optional, backward-compatible
  `onBeforeCleanup` hook on `HarnessDependencies`) runs verification against the real workspace
  before it's torn down, then builds and schema-validates an `Outcome`. Returns
  `{ run, trace, outcome, verifications, evidence }`.
- **One small, additive harness extension point** — `src/harness/runHarness.ts` gained
  `HarnessDependencies.onBeforeCleanup` (optional), invoked after the agent finishes and before
  workspace cleanup. Phase 3's `executeRun()` signature, behavior, and tests are unchanged when
  the hook is omitted.

## Tests

5 new test files, 22 new tests (89 total across 31 files, up from 67/26):
`determineOutcome.test.ts` (exhaustive table of every status-combination rule),
`testSuiteVerifier.test.ts` (pass/fail/missing-script cases, real `npm test` subprocess spawns),
`diffAnalysisVerifier.test.ts` (changed vs. identical file content), `runVerifiers.test.ts`
(skips non-applicable verifiers, collects execution errors without throwing), and
`evaluateRun.test.ts` — real end-to-end runs against the real fixtures:

- `debugging-01` + `NativeAgent` (makes no fix) → `Outcome.status: TASK_FAILURE`.
- `debugging-01` + a test-only `FixPaginationAgent` (genuinely patches the bug) →
  `agentReportedStatus: SUCCESS` **and** `Outcome.status: SUCCESS` — proves the pipeline can
  actually reach `SUCCESS`, not just always fail.
- `refactoring-01` + `NativeAgent` → `test-suite` passes (pre-refactor behavior is intact) but
  `diff-analysis` fails (nothing was changed) → `Outcome.status: TASK_FAILURE` overall — proves
  multi-evidence combination works, and that a self-reported/behaviorally-passing run can still
  correctly fail evaluation.
- Missing fixture → `ENVIRONMENT_FAILURE` passes through untouched, zero verifications attempted.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 89/89 tests passing across 31 files,
  zero lint errors.
- `rm -rf dist && npm run build` then checked for `*.test.*` under `dist/` — none; no test files
  leak into the compiled output.
- Manually exercised the **compiled** `dist/` evaluation pipeline (not just the `src/` Vitest
  path) end-to-end against the real `debugging-01` fixture via a one-off Node script — produced
  `Outcome.status: TASK_FAILURE` with one failing `test-suite` `Verification`, confirming
  production build parity.
- Fixed a Node `DEP0190` deprecation warning surfaced during the first test run (`spawn` with
  `shell: true` + an `args` array is unsafe if args aren't escaped) by passing the fixed,
  hardcoded `npm test` command as a single string with no `args` instead — no task/agent input
  ever reaches this command, so `shell: true` itself is safe, but the safer invocation form was
  used regardless.
- Quantitative modularity check: largest new source file is `testSuiteVerifier.ts` at 129 lines,
  well under the 300-line ceiling; `runHarness.ts` grew from 134 to 152 lines (the new optional
  hook) — the harness's Phase 3 test suite passed unchanged with no modifications, confirming the
  extension was truly additive.
- Security review note (master prompt §38/§62): this phase's only new attack surface is spawning
  `npm test` as a child process — the command itself is fixed and never constructed from
  task/agent-controlled input (only the working directory, an already-isolated temp copy from
  Phase 3, varies); no network calls beyond whatever the fixture's own test script would make (the
  current 3 fixtures make none), no secrets handled. No new attack surface of concern.

## Decisions made

ADR-008 in [[14-decisions]]: the pluggable, text-triggered `Verifier` registry; the rule that
`Outcome.status` always overrides `agentReportedStatus` (except for the infra-level statuses,
which pass through); the additive `onBeforeCleanup` harness extension point.

## Explicitly not implemented (by design, later phases)

- `static-analysis`, `repository-invariant`, `acceptance-criteria-check`, `security-check`,
  `architecture-check`, `human-review`, `llm-judge` verifiers — only `test-suite` and
  `diff-analysis` were needed to evaluate the 3 fixtures that currently have real source code;
  `verificationMethodSchema`'s other enum members remain interface-only until a fixture actually
  needs them. Adding one is a single new file implementing `Verifier` plus a registry entry.
- Verification for the 27 `"unpinned"` tasks — no fixture source code exists for them yet
  (tracked backlog, unchanged from Phase 3, see [[20-next-actions]]).
- Metrics computation from `Outcome`/`Evidence` records — Phase 5.
- Any notion of "verification budget" across a full experiment (batching, parallelism, retries
  across many runs) — this phase only proves single-run verification; orchestrating many runs is
  later work.
- `Evaluation`/`Report` entity population — Phase 5/9 respectively; this phase produces `Outcome`
  and its supporting `Verification`/`Evidence` records only.

## Known limitations

- `diffAnalysisVerifier`'s check is coarse (did anything change, not "was it the right change") —
  documented as an accepted trade-off in ADR-008, not a defect.
- `testSuiteVerifier` spawns a real child process per verification; no resource limits (CPU/
  memory) are applied beyond the wall-clock timeout — acceptable while fixtures are small, trusted,
  self-authored mini-repos with no dependencies; revisit alongside the container/process
  sandboxing risk already tracked in [[16-risks]] before running untrusted agent-generated code.
- `EvidenceSchema`'s `content` field is truncated to 8000 characters for verifier output — long
  test-suite output beyond that is not preserved; acceptable for the current small fixtures.

## Risks discovered

None new beyond what [[16-risks]] already tracks; the "no CPU/memory sandboxing on spawned
processes" point above sharpens the existing filesystem-only-isolation risk rather than adding a
new one.

## Status

Complete, pending user approval to begin Phase 5 (Metrics).
