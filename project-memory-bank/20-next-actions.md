# 20 — Next Actions

1. **Immediate:** await explicit user approval to proceed with executing a live comparison run
   (item 2 below) or Phase 9. Phase 7's roadmap scope (including failure analysis, item 2a below)
   and Phase 8's orchestration follow-up (item 2b below) are now both fully implemented.
2. **Phase 6 remainder — now implemented, live execution still open:**
   - `LlmSolvingAgent` (`src/harness/agents/llmSolvingAgent.ts`) is the real, LLM-backed solving
     agent, supporting Claude, ChatGPT, Gemini, or a local model via `src/harness/llm/` (ADR-013
     in [[14-decisions]]). It runs under **every** condition in the real comparison, including the
     native baseline — `NativeAgent` is *not* the baseline agent there; only the `ContextProvider`
     varies (native/ECC/each ablated component), per [[09-experiment-strategy]]'s causal-isolation
     principle. This corrects this item's earlier wording, which literally said `NativeAgent`
     "remains the native/no-context baseline" — see ADR-013 for the full reasoning. `NativeAgent`
     is unmodified and still used only in its own harness-plumbing tests.
   - `src/experiments/runComparisonExperiment.ts` runs the actual controlled comparison (native +
     full ECC + each `AblatedEccContextProvider` component = 9 conditions) × the 3 real-fixture
     tasks × 3 repetitions, and `src/experiments/analyzeComparisonResults.ts` feeds the results
     into Phase 7's `analyzeRepeatedRuns()` and Phase 8's `analyzeComponentContributions()`
     unchanged. **Not yet done:** actually *executing* this against a live LLM backend — that
     needs the user's own credentials/local server (`EEP_LLM_PROVIDER`/`EEP_LLM_MODEL`/
     `EEP_LLM_API_KEY`/`EEP_LLM_BASE_URL`, see `llmProviderConfigFromEnv.ts`) and a deliberate
     `npm run experiment:run` (then `npm run experiment:analyze`), which this implementation does
     not trigger automatically. See [[phases/phase-06]].
   - `Run.metadata.modelName`/`modelVersion` (required per [[10-reproducibility]]) are still not
     populated — `HarnessRunConfig`/`runHarness.ts` have no channel for an agent to report which
     model powered a run. Partial mitigation: `LlmSolvingAgent`'s default `Agent.name` embeds the
     exact provider/model. Fixing this properly means adding optional `modelName`/`modelVersion`
     fields to `HarnessRunConfig` and setting them in `executeRun()` from the agent's own identity
     — a small, additive `runHarness.ts` change, not yet made (outside the Phase 6 remainder's
     approved file scope). Pick this up before treating comparison-run results as fully
     reproducible metadata.
   - `EccContextProvider`/`AblatedEccContextProvider` currently have no real `tokenCount` from
     ECC's CLI contract, so both use Phase 5's `estimateTokenCount()` fallback on the serialized
     package — revisit if ECC's documented output ever adds one.
2a. **Phase 7 remainder — now implemented:** `src/analysis/failureClustering.ts`'s
   `analyzeFailureClusters()` (the 4th item in [[13-roadmap]]'s Phase 7 row) clusters
   `verificationMethod` failure rates overall and by condition/category/complexity, with a Wilson
   confidence interval per cluster (reusing `proportionConfidenceInterval()` from ADR-011's
   machinery, not new statistics), sorted worst-failure-rate-first.
   `src/experiments/analyzeComparisonResults.ts` wires it in alongside `analyzeRepeatedRuns()`/
   `analyzeComponentContributions()`. Proven correct against synthetic verification data in tests
   only — like the rest of Phase 7/8, it has not yet run against a real comparison run's data,
   since none has been executed (see item 2). See [[phases/phase-07]]'s remainder section.
2b. **Phase 8 orchestration — now implemented:** `src/experiments/experimentConditions.ts` builds
   all 7 `AblatedEccContextProvider` component conditions (plus native and full ECC) and
   `runComparisonExperiment.ts` runs every one against the benchmark end-to-end. As with item 2,
   the mechanism is built and tested but has not yet been executed against a live LLM backend.
3. **Fixture backlog (not phase-blocking, pick up incrementally):** 27 of the 30 tasks still use
   the `"unpinned"` sentinel — only `debugging-01`, `feature-01`, `refactoring-01` have real
   fixture source code, a real `commitSha`, and real verification coverage. Author the rest the
   same way (build in a scratch location, `git commit` for a real SHA, copy the working tree
   without `.git` into `benchmark/fixtures/<id>/`) as they're needed. `feature-01` still has not
   been exercised through `executeEvaluatedRun()`/`computeRunMetrics()` in a test.
4. **Verifier coverage backlog (not phase-blocking):** 7 of the 9 `verificationMethod` enum values
   have no `Verifier` implementation yet — add one as a fixture actually needs it, following the
   `Verifier` interface + `ALL_VERIFIERS` registry pattern (ADR-008).
5. **Metrics coverage backlog (not phase-blocking):** 8 of the 22 named metrics
   (`evidence-recall`/`-precision`/`-authority`/`-freshness`, `context-redundancy`,
   `regression-rate`, `risk-classification`, `decision-confidence`) are not computed. Now that
   `EccContextProvider` exists, its `ContextArtifact.content` carries ECC's real per-item
   `relevance`/`trustLevel`/`provenance.authority`/`provenance.freshness` data — a genuine future
   data source for `evidence-recall`/`-precision`/`-authority`/`-freshness` once a pipeline stage
   extracts it into `Evidence[]` records (no such extraction path exists yet; the artifact's
   content is opaque text to the rest of the system today). `context-redundancy`,
   `regression-rate`, `risk-classification`, and `decision-confidence` still need other data
   sources entirely (cross-run history, a `Task.risk` field, a `Decision.confidence` field). See
   ADR-009 in [[14-decisions]] for the full reasoning per metric — do not compute any of these
   until a real source lands, per that ADR's discipline.
6. **Environment portability note:** `EccContextProvider`/`ProcessEccCliInvoker` never hardcode a
   path to the sibling ECC checkout — the invoked command defaults to `ECC_CLI_COMMAND` env var
   (else `"ecc"` on PATH) with optional `commandArgs`. To point at a local ECC checkout without a
   global `npm link`, construct with `{ command: 'node', commandArgs: ['<checkout>/dist/cli/index.js'] }`
   or set `ECC_CLI_COMMAND=node` and pass `commandArgs` accordingly. See ADR-010 and
   [[phases/phase-06]].

7. **Statistics convention note (ADR-011):** `src/analysis/` supports exactly three confidence
   levels (90%/95%/99%), each backed by an exact published critical value — do not add a new
   level without adding its exact table value, and do not replace the table with an approximated
   inverse-distribution formula. To add multiple-comparisons correction (flagged as a known
   limitation in [[phases/phase-07]]), that belongs in Phase 9's reporting layer, not by changing
   `analyzeRepeatedRuns()`'s per-comparison confidence level.

8. **Ablation convention note (ADR-012):** `src/harness/providers/eccAblation.ts` only ablates
   fields ECC's documented package contract already reports — never invent a component dimension
   ECC doesn't actually surface. Ablation is content-level (post-hoc field removal from the CLI's
   JSON output), not a true inside-ECC per-component toggle, since ECC's CLI contract has no such
   flag and EEP cannot fork/patch ECC (ADR-001). If ECC's documented contract ever adds a
   per-component flag, prefer wiring that directly over content-level ablation.

9. **LLM backend convention note (ADR-013):** `src/harness/llm/createLlmClient.ts` never picks a
   default provider — `src/experiments/llmProviderConfigFromEnv.ts` always resolves
   `EEP_LLM_PROVIDER` (`"anthropic"` or `"openai-compatible"`), `EEP_LLM_MODEL`, and
   `EEP_LLM_API_KEY`/`EEP_LLM_BASE_URL` as applicable from the environment, throwing
   `MissingLlmConfigError` rather than silently falling back. To add a fifth backend that isn't
   Anthropic-native or OpenAI-compatible-shaped, add a third `LlmClient` implementation rather than
   overloading either existing adapter. To run the real comparison against a local model, set
   `EEP_LLM_PROVIDER=openai-compatible` and `EEP_LLM_BASE_URL` to that local server's URL (e.g.
   Ollama's `http://localhost:11434/v1`) — no `EEP_LLM_API_KEY` needed. See
   `agentBudgetConfigFromEnv()` for the agent's own turn/token/wall-clock budget env vars
   (`EEP_AGENT_MAX_TURNS`, `EEP_LLM_MAX_TOKENS`, `EEP_AGENT_WALL_CLOCK_BUDGET_MS`).

Do not start Phase 9 implementation, and do not execute a live comparison run, before approval is
given (master prompt §40).
