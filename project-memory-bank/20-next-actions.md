# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 1.
2. **Phase 1 (Evaluation Contract), once approved:**
   - Define concrete TypeScript types/schemas (likely Zod-backed) for Task, Experiment,
     Condition, Run, Trace, Evidence, ContextArtifact, Decision, Action, Verification, Outcome,
     Metric, Evaluation, Report — replacing the stubs in `schemas/`.
   - Define the `ContextProvider` and `Agent` interfaces referenced in [[04-architecture]].
   - Establish schema versioning conventions per [[10-reproducibility]].
   - Update `schemas/*.md` from stubs to real specs (or point to the TS source as source of
     truth, per the memory-bank token-efficiency rule — don't duplicate).
   - Update this file, [[18-current-state]], and [[19-phase-status]] at the end of Phase 1.

Do not start Phase 1 implementation before approval is given (master prompt §40).
