# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 6 (ECC Integration).
2. **Fixture backlog (not phase-blocking, pick up incrementally):** 27 of the 30 tasks still use
   the `"unpinned"` sentinel — only `debugging-01`, `feature-01`, `refactoring-01` have real
   fixture source code, a real `commitSha`, and real verification coverage. Author the rest the
   same way (build in a scratch location, `git commit` for a real SHA, copy the working tree
   without `.git` into `benchmark/fixtures/<id>/`) as they're needed. `feature-01` still has not
   been exercised through `executeEvaluatedRun()`/`computeRunMetrics()` in a test — a reasonable
   first target for broader coverage before Phase 6.
3. **Verifier coverage backlog (not phase-blocking):** 7 of the 9 `verificationMethod` enum values
   have no `Verifier` implementation yet — add one as a fixture actually needs it, following the
   `Verifier` interface + `ALL_VERIFIERS` registry pattern (ADR-008).
4. **Metrics coverage backlog (not phase-blocking):** 8 of the 22 named metrics
   (`evidence-recall`/`-precision`/`-authority`/`-freshness`, `context-redundancy`,
   `regression-rate`, `risk-classification`, `decision-confidence`) are not computed — each needs
   a data source that doesn't exist yet (see ADR-009 in [[14-decisions]] for specifics per
   metric). Revisit once Phase 6 (a real curated ContextProvider) or a richer verifier gives one
   of them a real basis.
5. **Phase 6 (ECC Integration), once approved:**
   - Implement a real `ContextProvider` backed by ECC (via the existing interface only — never a
     direct import of ECC internals, per [[00-project-charter]]/ADR-001).
   - Implement a real solving agent (an LLM coding agent), replacing `NativeAgent` as the
     "does real work" condition — `NativeAgent` remains as the native/no-context baseline.
   - Wire Conditions A-D from [[09-experiment-strategy]] to real providers/agents so a controlled
     comparison (native vs. ECC-assisted) can actually run.
   - Once ECC provides a real `tokenCount` on its `ContextArtifact`, revisit whether
     `estimateTokenCount()` is still needed as a fallback (it should remain one, for any future
     provider that also doesn't report tokens).
   - Update `implementation-status.md`, `active-context.md`, [[18-current-state]], and
     [[19-phase-status]] at the end of Phase 6.

Do not start Phase 6 implementation before approval is given (master prompt §40).
