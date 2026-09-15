# 20 — Next Actions

1. **Immediate:** await explicit user approval to proceed with the rest of Phase 6/7's roadmap
   scope (a real solving agent, an actual comparison run, failure analysis) or to move on to
   Phase 9.
2. **Phase 6 remainder (not yet done):**
   - Implement a real solving agent (an LLM coding agent) for Condition B/C, replacing
     `NativeAgent` as the "does real work" condition — `NativeAgent` remains the native/no-context
     baseline.
   - Wire Conditions A-D from [[09-experiment-strategy]] to real providers/agents and run an
     actual controlled comparison (native vs. `EccContextProvider`-assisted, and each
     `AblatedEccContextProvider` component variant) against the benchmark. This is also the
     prerequisite for Phase 7's `analyzeRepeatedRuns()` and Phase 8's
     `analyzeComponentContributions()` to run against real data instead of synthetic fixtures.
   - `EccContextProvider`/`AblatedEccContextProvider` currently have no real `tokenCount` from
     ECC's CLI contract, so both use Phase 5's `estimateTokenCount()` fallback on the serialized
     package — revisit if ECC's documented output ever adds one.
2a. **Phase 7 remainder (not yet done):** failure analysis (the 4th item in [[13-roadmap]]'s
   Phase 7 row, alongside repeated-run/category/complexity analysis) — not requested this round's
   exit criterion; add once there is real failure data (from an actual comparison run) to analyze,
   e.g. which `verificationMethod` most often fails, clustered by category/complexity/condition.
2b. **Phase 8 orchestration (not yet done, not phase-blocking):** nothing yet automatically runs
   all 7 `AblatedEccContextProvider` component conditions against the benchmark end-to-end — that
   is an experiment-orchestration concern bundled with item 2's "actual comparison run," not part
   of Phase 8's exit criterion (the ablation mechanism and measurement).
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

Do not start further Phase 8/9 implementation before approval is given (master prompt §40).
