# Phase 6 — ECC Integration

## Objective

Per this round's user-specified exit criterion (narrower than [[13-roadmap]]'s full Phase 6
scope): a real `ContextProvider` implementation wrapping ECC via its external interface only —
no internal coupling to ECC's source.

## Implemented

- **`src/harness/providers/eccPackageSchema.ts`** — EEP's own independent Zod mirror of ECC's
  documented `EngineeringContextPackage` output contract (task, repository, ranked
  primary/supporting evidence with `relevance`/`trustLevel`/`provenance`, conflicts, history,
  constraints, unknowns, verification plan, exclusion summary). Deliberately re-declared rather
  than imported from ECC — if ECC's internal types ever changed shape, this file is the one
  place that would need updating, and EEP would never notice a source-level break because there
  is no source-level dependency to break.
- **`src/harness/providers/eccCliInvoker.ts`** — `ProcessEccCliInvoker`, a configurable subprocess
  wrapper around ECC's published CLI contract (`ecc context "<task>" --path <dir> [--budget
  <n>]`, documented in ECC's own README). Uses array-argument `execFile` (never shell string
  interpolation), matching ECC's own documented security posture, so a task description
  containing shell metacharacters can never be interpreted as a second command. Throws
  `EccInvocationError` (spawn failure, nonzero exit) or `EccTimeoutError` (wall-clock timeout)
  rather than ever returning a false success. The command/args are never hardcoded — default
  `ECC_CLI_COMMAND` env var, else `"ecc"` on PATH, with optional `commandArgs` for e.g. `node
  <checkout>/dist/cli/index.js` — so no EEP code encodes any one machine's ECC checkout location.
- **`src/harness/providers/eccContextProvider.ts`** — `EccContextProvider implements
  ContextProvider`, Condition B/C's real curated context source. Invokes ECC, parses stdout as
  JSON, validates it against `eccPackageSchema.ts`, and — only if valid — turns the
  pretty-printed, validated package into a schema-valid `ContextArtifact` (the package JSON
  itself is the `content`, i.e. exactly what a real integration would hand to a consuming agent).
  `tokenCount` uses Phase 5's `estimateTokenCount()` since ECC's CLI contract does not itself
  report one.

## Tests

5 new test files, 14 new tests (130 total across 41 files, up from 116/37):
`eccPackageSchema.test.ts` (valid/invalid package shapes, an invalid `trustLevel` enum value),
`eccCliInvoker.test.ts` (spawns small self-authored fake-CLI Node scripts — success, nonzero
exit, timeout, missing command, and argv-passthrough-safety cases — never depends on a real ECC
checkout), `eccContextProvider.test.ts` (injects a fake `EccCliInvoker`, no subprocess — valid
package, invoker failure, invalid JSON, schema-invalid JSON), and
`eccContextProvider.realCli.test.ts` — one real, end-to-end invocation of an actual sibling ECC
checkout's built CLI against this repository, `skipIf`-gated on that checkout existing at
`../Engineering-Context-Compiler/dist/cli/index.js` relative to this repo, so the suite stays
green (via a skip, not a failure) in any environment that only has this repo checked out.

## Validation

- `npm run build && npm test && npm run lint` — clean build, 130/130 tests passing across 41
  files, zero lint errors, including the real-ECC integration test actually running (not
  skipped) on this machine — confirmed by re-running it alone with the verbose reporter.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output.
- Quantitative modularity check: largest new source file is `eccCliInvoker.ts` at 101 lines,
  comfortably under the 300-line ceiling; all other new files are smaller.
- Security review note: task descriptions and repository paths reach the ECC subprocess only as
  `execFile` array arguments, never concatenated into a shell command string — a task description
  containing shell metacharacters cannot be interpreted as a second command (verified by a
  dedicated test). No new network calls; the only new I/O is the local subprocess invocation
  itself.

## Decisions made

ADR-010 in [[14-decisions]]: CLI subprocess invocation over an artifact-file contract or a
library import; EEP owns an independent schema mirror rather than trusting ECC's output
unchecked; the command invoked is fully configurable, never hardcoded.

## Explicitly not implemented (by this first round's design, later work — see the remainder below)

- A real solving agent for Condition B/C — this phase's user-specified exit criterion covered
  only the `ContextProvider`. `NativeAgent` remains the only working agent; nothing yet plays the
  "does real work with ECC's context" role.
- An actual multi-condition comparison run (Native vs. ECC-assisted) against the benchmark —
  `EccContextProvider` is proven to work end-to-end in isolation, but no experiment has wired it
  together with an agent and run it across tasks yet.
- Extracting ECC's per-item `relevance`/`trustLevel`/`provenance.authority`/`provenance.freshness`
  data out of the opaque `ContextArtifact.content` into real `Evidence[]` records — this would be
  a genuine, non-fabricated future data source for 4 of ADR-009's 8 unimplemented secondary
  metrics, but no such extraction pipeline exists yet; noted as a next action, not built
  speculatively ahead of a concrete need.
- Any change to the `ContextProvider` interface itself — `EccContextProvider` implements the
  exact same contract `NativeContextProvider` already does, so nothing upstream (the harness,
  evaluation, or metrics layers) needed to change.

## Known limitations (this first round)

- `EccContextProvider` depends on a working ECC installation being reachable via a configured
  command — there is no bundled/vendored fallback, by design (the repository boundary rule
  prohibits vendoring ECC into this repo).
- The real-CLI integration test is environment-conditional (`skipIf`); a reviewer running the
  suite without a built sibling ECC checkout will see it skipped, not passing — this is
  intentional (see ADR-010), but means that specific proof only re-runs on a machine with both
  repos present and built.
- ECC's CLI contract does not report a real token count, so `EccContextProvider` still relies on
  Phase 5's ~4-chars/token heuristic estimate, same as `NativeContextProvider`.

## Risks discovered (this first round)

Two risk-register updates in [[16-risks]]: the pre-existing "stale engineering evidence" risk is
now assessed (ECC's contract does carry a `freshness` field per evidence item, but nothing reads
it yet); a new risk was added for depending on ECC as an external, versioned CLI dependency EEP
does not control, mitigated by schema validation and configurable invocation.

---

## Phase 6 remainder — Real Solving Agent + Actual Comparison Run

### Objective

Close the rest of [[13-roadmap]]'s Phase 6 scope: a real solving agent for Condition B/C, and an
actual native-vs-ECC (and per-ablation-component) comparison run — the prerequisite for Phase 7's
`analyzeRepeatedRuns()` and Phase 8's `analyzeComponentContributions()` to run against real, not
synthetic, data.

### Implemented

- **`src/harness/llm/`** — a multi-provider LLM client layer (ADR-013 in [[14-decisions]]):
  `llmClient.types.ts` (neutral `LlmClient`/`LlmMessage`/`LlmToolCall` shape),
  `anthropicLlmClient.ts` (`AnthropicLlmClient`, covers Claude via Anthropic's Messages API),
  `openAiCompatibleLlmClient.ts` (`OpenAiCompatibleLlmClient`, one implementation covering
  ChatGPT, Gemini via Google's OpenAI-compatibility endpoint, and any local OpenAI-compatible
  server such as Ollama/LM Studio, purely by `baseUrl`/`model` configuration), and
  `createLlmClient.ts` (factory over an explicit `LlmProviderConfig` — no hardcoded default
  vendor). Both clients use Node's global `fetch`; no new npm dependency.
- **`src/harness/agents/llmSolvingAgent.ts`** — `LlmSolvingAgent implements Agent`: a bounded tool
  loop (prompt → model turn → tool execution → feed result back) that pairs with *any*
  `ContextProvider` unchanged, including `NativeContextProvider`. Reports `SUCCESS`/`INCOMPLETE`/
  `TIMEOUT`/`AGENT_FAILURE` as provenance only — never authoritative (ADR-008 unchanged).
- **`src/harness/agents/llmAgentTools.ts`** — the agent's entire tool surface: `list_files`,
  `read_file`, `write_file` (all path-clamped against the workspace root — model-supplied
  arguments are untrusted input) and `run_tests` (always the fixture's own fixed `npm test`). No
  generic shell-exec tool exists.
- **`src/harness/agents/promptBuilder.ts`** — builds the system prompt and the initial user
  message from a `Task` plus whatever `ContextArtifact` the paired `ContextProvider` produced.
- **`src/harness/support/runNpmTest.ts`** — the `npm test` spawn logic, extracted unchanged out of
  `testSuiteVerifier.ts` so the verifier and the `run_tests` tool share one implementation;
  `testSuiteVerifier.ts` was edited to use it, with no behavior change (its own tests pass
  unmodified).
- **`src/experiments/`** — the orchestration layer: `experimentConditions.ts` (builds the 9 real
  conditions — native + full ECC + 7 per-component ablations, every one paired with
  `LlmSolvingAgent`), `llmProviderConfigFromEnv.ts` (resolves `LlmProviderConfig` + agent budgets
  from `EEP_LLM_*`/`EEP_AGENT_*` env vars, throwing a clear error rather than picking a silent
  default), `resultsWriter.ts` (writes/reads each run's full bundle as raw JSON under
  `experiment-results/<experimentId>/`), `runComparisonExperiment.ts` (the main loop: 3 real
  fixture tasks × 9 conditions × 3 repetitions through `executeEvaluatedRun()` +
  `computeRunMetrics()`), and `analyzeComparisonResults.ts` (reads the dumped bundles back and
  drives Phase 7/8's analysis functions, completely unchanged, against them). Both scripts are
  runnable directly (`npm run experiment:run` / `npm run experiment:analyze`).
- **The NativeAgent correction** (see ADR-013 for full reasoning): `LlmSolvingAgent`, not the old
  `NativeAgent`, is the agent used for the native baseline condition in the real comparison run —
  only the `ContextProvider` varies across all 9 conditions, per
  [[09-experiment-strategy]]'s causal-isolation principle. `NativeAgent` itself is untouched and
  still used only in its own harness-plumbing tests.

### Tests

11 new test files, 53 new tests (258 total across 64 files, up from 205/53):
`anthropicLlmClient.test.ts`/`openAiCompatibleLlmClient.test.ts` (stub global `fetch` via
`vi.stubGlobal` — no real network calls or API cost), `createLlmClient.test.ts`,
`llmAgentTools.test.ts` (includes a dedicated path-traversal-rejection test for both `read_file`
and `write_file`), `promptBuilder.test.ts`, `llmSolvingAgent.test.ts` (a fake `LlmClient` scripted
via a small in-file class — covers the turn loop, tool execution, max-turn exhaustion, wall-clock
timeout, and client-error handling), `runNpmTest.test.ts`, `experimentConditions.test.ts`,
`llmProviderConfigFromEnv.test.ts`, `resultsWriter.test.ts`, and `analyzeComparisonResults.test.ts`
(an end-to-end wiring check using synthetic bundles — no live LLM/ECC call — proving the analysis
path correctly reconstructs `RunAnalysisRecord[]` and drives Phase 7/8's functions).

### Validation

- `npm run build && npm test && npm run lint` — clean build, 258/258 tests passing across 64
  files, zero lint errors.
- `rm -rf dist && npm run build` — confirmed no `*.test.*` files leak into the compiled output;
  the two CLI entry points (`dist/experiments/runComparisonExperiment.js`,
  `dist/experiments/analyzeComparisonResults.js`) compiled correctly.
- Quantitative modularity check: largest new file is `anthropicLlmClient.ts` at 143 lines,
  comfortably under the 300-line ceiling; all 16 new/edited files are smaller (1,361 lines total).
- `git status --short` reviewed — change set matches intent (new `src/harness/llm/`,
  `src/harness/agents/llmAgentTools.ts`/`promptBuilder.ts`/`llmSolvingAgent.ts`,
  `src/harness/support/runNpmTest.ts`, `src/experiments/`; edited
  `src/evaluation/verifiers/testSuiteVerifier.ts`, `src/harness/index.ts`, `package.json`,
  `.gitignore`).

### Decisions made

ADR-013 in [[14-decisions]]: two wire adapters (Anthropic-native, OpenAI-compatible) cover four
target backends (Claude, ChatGPT, Gemini, local LLM); the same `LlmSolvingAgent` runs under every
condition including native, correcting [[20-next-actions]]'s prior literal wording; a narrow,
path-clamped, no-shell-exec tool surface for the agent.

### Explicitly not implemented (by design, later work)

- **Actually executing a live comparison run.** This round delivers and tests the mechanism
  (mocked LLM responses in unit tests, a synthetic-bundle wiring test for the analysis path); it
  does not itself call a real paid cloud API or a real local model. Running it for real requires
  the user's own `EEP_LLM_*` configuration and is triggered by `npm run experiment:run`, not done
  automatically as part of this implementation.
- **`Run.metadata.modelName`/`modelVersion`** — still not populated; `HarnessRunConfig`/
  `runHarness.ts` have no channel for an agent to report which model powered a run, and extending
  them was outside this round's file scope. Partially mitigated: `LlmSolvingAgent`'s default
  `Agent.name` embeds the exact provider and model (e.g.
  `llm-solving-agent:anthropic:claude-sonnet-5`), so `Run.metadata.agentName` still distinguishes
  runs by backend/model even though the dedicated fields stay empty. See ADR-013.
- **The remaining 27 fixture tasks.** The comparison run is scoped to the 3 tasks with real
  fixture code (`debugging-01`, `feature-01`, `refactoring-01`), per the user's explicit scoping
  answer this round — unchanged backlog, see [[20-next-actions]].
- **Phase 9's canonical `Report`/persistence format.** `experiment-results/` is a plain,
  gitignored JSON dump this project makes no long-term schema commitment to, not a pre-emption of
  Phase 9.
- **A general-purpose CLI.** The orchestration is two npm-script-invoked Node entry points, not a
  new CLI framework — the CLI item in [[13-roadmap]] stays "not started."

### Known limitations

- Cost/rate-limit behavior of real cloud providers under a full 81-run comparison (3 tasks × 9
  conditions × 3 repetitions, each potentially several LLM turns) has not been characterized,
  since no live run has been executed yet.
- The OpenAI-compatible adapter inherits whatever gaps exist in a given vendor's own
  OpenAI-compatibility shim (e.g. partial tool-calling support on some local models), rather than
  using that vendor's native wire format — documented in ADR-013, not silently assumed away.
- The agent's tool surface has no CPU/memory/network sandboxing beyond the existing
  filesystem-copy isolation (ADR-007) — `run_tests` still spawns a real child process with only a
  wall-clock timeout. Narrower than a generic shell-exec tool, but still real code execution; see
  the updated risk note in [[16-risks]].

### Risks discovered

The "Baseline weakness" risk in [[16-risks]] is now **Mitigated** by this round's NativeAgent
correction (the same `LlmSolvingAgent` runs under every condition). The environment-isolation
risk's "revisit before any agent executes untrusted generated commands" trigger has now arrived —
assessed and re-noted, still **Open** (narrowed, not closed): the tool surface is bounded and
path-clamped, but `run_tests` still executes real model-written code with no CPU/memory/network
sandbox. "Nondeterminism across runs," "Agent/model version drift," and "Excessive evaluation
cost" are now concretely live (a real LLM backend introduces sampling nondeterminism, per-call
cost, and model-version sensitivity) rather than hypothetical — notes updated in [[16-risks]].

### Status

Complete: the real solving agent and the comparison-run mechanism are implemented and tested.
**No live comparison run has been executed** — that requires the user's own LLM credentials
and/or local server and a deliberate `npm run experiment:run` invocation, which is not something
this implementation performs automatically. Phase 7's remainder (failure analysis) and Phase 8's
orchestration follow-up are both now also complete, see [[phases/phase-07]]. Pending user approval
to proceed to Phase 9, or to execute a live comparison run.
