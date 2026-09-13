# Phase 3 — Experiment Harness

## Objective

Per [[13-roadmap]]: agent adapter, context-provider adapter, environment isolation, trace
capture — a working pipeline that can execute a Run end-to-end against an isolated fixture and
capture a Trace.

## Implemented

- **Environment isolation** — `src/harness/workspace.ts`'s `createIsolatedWorkspace()` copies a
  fixture into a fresh, disposable `os.tmpdir()` directory (excluding `.git`) before any
  agent/provider touches it, and returns a `cleanup()`. See ADR-007 in [[14-decisions]].
- **Context-provider adapter** — `src/harness/providers/nativeContextProvider.ts`'s
  `NativeContextProvider`: hands the agent the task text plus a plain repository file listing
  (the "no curated context" baseline, Condition A in [[09-experiment-strategy]]).
- **Agent adapter** — `src/harness/agents/nativeAgent.ts`'s `NativeAgent`: deterministically
  explores the repository file tree (real `file-read` Actions), records one Decision, and
  reports `INCOMPLETE` (it performs no code generation — reporting `SUCCESS` would misrepresent
  what happened).
- **Harness orchestration** — `src/harness/runHarness.ts`'s `executeRun()`: given a `Task` +
  `Agent` + `ContextProvider` + run config, resolves the fixture path, isolates it, invokes the
  provider then the agent, assembles a schema-validated `Run` and `Trace`, and always cleans up
  the sandbox (even on failure). Never throws for an expected failure mode — a missing fixture or
  an adapter exception becomes an explicit `ENVIRONMENT_FAILURE` / `AGENT_FAILURE` on the Trace's
  new `agentReportedStatus` field, per the failure taxonomy in [[06-evaluation-methodology]].
- **Shared utility** — `src/harness/support/listFiles.ts`'s `listFilesRecursive()`, used by both
  adapters, capped at a configurable entry limit.
- **Two small interface fixes surfaced by real implementation** (see ADR-007): `AgentRunRequest`
  and `ContextProviderRequest` gained a required `runId`; `traceSchema` gained an optional
  `agentReportedStatus: RunStatus` field.
- **New shared primitive** — `src/domain/common/idGenerator.ts`'s `generateId<Brand>()`, used by
  the harness and adapters to mint fresh, correctly-branded entity IDs.
- **3 real fixtures** — `benchmark/fixtures/{debugging-01,feature-01,refactoring-01}/`, real
  runnable mini-repos (plain Node/CommonJS) with a genuine seeded bug / unimplemented feature /
  duplicated logic matching each task's description, plus a test file demonstrating the current
  (pre-fix) behavior. Each task's `repository.commitSha` was updated from `"unpinned"` to a real
  git commit SHA computed by actually committing that fixture's content (method: ADR-007).

## Tests

7 new test files, 14 new tests (67 total across 26 files, up from 53/20): `idGenerator.test.ts`,
`workspace.test.ts` (copy + isolation + cleanup + missing-fixture error), `listFiles.test.ts`,
`nativeContextProvider.test.ts`, `nativeAgent.test.ts`, `runHarness.test.ts` (real end-to-end run
against the real `debugging-01` fixture; sandbox-cleanup verification; `ENVIRONMENT_FAILURE` path
for a missing fixture), plus one added case in `trace.schema.test.ts` for
`agentReportedStatus`. All fixture seeded-bug/behavior claims were independently verified by
running each fixture's own test file directly with `node` before committing it (see Validation).

## Validation

- `npm run build && npm test && npm run lint` — clean build, 67/67 tests passing across 26
  files, zero lint errors.
- `rm -rf dist && npm run build` then `find dist -name "*.test.*"` — empty; no test files leak
  into the compiled output.
- Ran each fixture's test file directly with `node` before committing: `debugging-01` fails (the
  seeded off-by-one bug is real), `feature-01` fails (`exportToCsv` genuinely throws
  "not implemented"), `refactoring-01` passes (the three modules' current, subtly-inconsistent
  behavior is captured correctly by their own tests) — confirming each fixture is a real,
  representative artifact, not an inert placeholder.
- Manually exercised the **compiled** `dist/` harness (not just the `src/` Vitest path) against
  the real `debugging-01` fixture end-to-end via a one-off Node script — produced a valid `Run`
  and `Trace` (4 actions, `agentReportedStatus: INCOMPLETE`), confirming production build parity
  with the test path.
- Added `benchmark/fixtures/**` to `eslint.config.js`'s ignore list — these are benchmark data
  (self-contained plain-JS/CJS mini-repos an agent-under-test operates on), not EEP's own
  TypeScript/ESM source, and were never meant to satisfy EEP's own lint conventions.
- Quantitative modularity check: largest new source file is `runHarness.ts` at 134 lines, well
  under the 300-line ceiling.
- Security review note (master prompt §38/§62): this phase's only new attack surface is
  filesystem copy/cleanup of fixture directories, scoped to `os.tmpdir()`; no network calls, no
  execution of fixture code, no secrets handled. No new attack surface of concern.

## Decisions made

ADR-007 in [[14-decisions]]: filesystem-copy isolation (not containers) for Phase 3, chosen for
local-first simplicity per ADR-004, revisit before any agent executes untrusted fixture code; the
ephemeral-git-commit method for obtaining a real `commitSha` without embedding a nested `.git`
(which would otherwise become a Git "gitlink" and silently break the fixture convention from
ADR-006); the two interface fixes; the `agentReportedStatus` addition to `Trace`.

## Explicitly not implemented (by design, later phases)

- Fixture source code / real `commitSha` for the remaining 27 tasks — tracked backlog, see
  [[20-next-actions]]; scoped down deliberately for this phase (roadmap Phase 3 scope is the
  harness mechanism, not full benchmark fixture population — confirmed with the user before
  starting this phase).
- Any agent that actually attempts to solve a task (code generation/editing) — `NativeAgent` is a
  deliberately inert baseline; a real solving agent is later work.
- Verification execution (turning acceptance criteria into a pass/fail `Verification` record) and
  `Outcome` construction — Phase 4 (Deterministic Evaluation).
- Container/process-level sandboxing, resource limits, network isolation — not needed until an
  agent executes untrusted generated commands; flagged in [[16-risks]].
- ECC adapter / any real context-curation logic — Phase 6.

## Known limitations

- `NativeAgent`'s file-read action count is capped (default limit 200 in `listFilesRecursive`)
  — adequate for small benchmark fixtures, will need revisiting for any future fixture with a
  large file count.
- The isolated workspace is a plain directory copy, not a git working tree — an agent inside the
  sandbox has no `git` history to inspect, only the file contents at the pinned commit. Acceptable
  for Phase 3/4 scope; would need reconsideration if a future agent needs `git blame`/`git log`.

## Risks discovered

None new beyond what [[16-risks]] already tracks; the sandboxing trade-off above is the main one
worth watching as agent capability grows.

## Status

Complete, pending user approval to begin Phase 4 (Deterministic Evaluation).
