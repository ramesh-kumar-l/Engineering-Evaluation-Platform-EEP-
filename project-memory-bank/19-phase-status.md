# 19 — Phase Status

| Phase | Status |
|---|---|
| 0 — Project Foundation | Complete |
| 1 — Evaluation Contract | Complete |
| 2 — Benchmark V1 | Complete |
| 3 — Experiment Harness | Complete |
| 4 — Deterministic Evaluation | Complete |
| 5 — Metrics | Complete |
| 6 — ECC Integration | Complete (ContextProvider, LLM solving agent, comparison-run mechanism — full roadmap scope); no live comparison run executed yet |
| 7 — Experimental Analysis | Complete (confidence intervals + effect size across categories/complexity, plus failure clustering by verificationMethod/condition/category/complexity — full roadmap scope), pending user approval to proceed |
| 8 — Ablation | Complete (per-component measurement of ECC's contribution), pending user approval to proceed |
| 9 — Reporting | Not started |
| 10 — Dashboard Feasibility / MVP | Not started |
| 11 — Public Benchmark | Not started |
| 12 — External Reproduction | Not started |
| 13 — CI / GitHub Integration | Not started |

Per the strict phase gate ([[00-project-charter]] §Working protocol), Phase 9 does not begin
until the user explicitly approves proceeding past Phase 8. Phase 6 is now complete against
[[13-roadmap]]'s full original scope: `EccContextProvider` (a real `ContextProvider`),
`LlmSolvingAgent` (a real, multi-provider LLM solving agent, ADR-013 in [[14-decisions]]), and
`src/experiments/` (an actual native-vs-ECC-vs-per-ablation-component comparison-run mechanism,
scoped to the 3 real-fixture tasks). What remains is executing a live run — that needs the user's
own LLM credentials/local server and a deliberate `npm run experiment:run`, which this
implementation does not trigger automatically; see [[phases/phase-06]] and [[20-next-actions]].
Phase 7's exit criterion this round was originally scoped by the user to confidence intervals and
effect size across categories/complexity; failure analysis (the 4th item in [[13-roadmap]]'s
Phase 7 row) was closed in a later session — `src/analysis/failureClustering.ts`'s
`analyzeFailureClusters()` clusters `verificationMethod` failure rates overall and by condition/
category/complexity, reusing the same Wilson-interval machinery Phase 7 already built for
`task-success` (ADR-011). Phase 7 is now complete against [[13-roadmap]]'s full row. Phase 8's
exit criterion (per-component measurement of ECC's contribution) matches [[13-roadmap]]'s Phase 8
row exactly and is fully built (the ablation mechanism plus measurement). Phase 7's
`analyzeRepeatedRuns()`, its `analyzeFailureClusters()`, and Phase 8's
`analyzeComponentContributions()` are all now exercised by
`src/experiments/analyzeComparisonResults.ts` and proven correct against synthetic bundles in
tests, but none has run against a live-executed comparison's real data yet, since no live run has
been executed (see above).
