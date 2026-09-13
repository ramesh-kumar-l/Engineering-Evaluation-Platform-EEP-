# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 3.
2. **Phase 3 (Experiment Harness), once approved:**
   - Author real fixture source code under `benchmark/fixtures/<id>/` for each of the 30 tasks
     (currently only a README placeholder exists), and assign each task's `repository.commitSha`
     a real value, replacing the `"unpinned"` sentinel — see ADR-006 in [[14-decisions]].
   - Build environment isolation for running an agent against a fixture (process/container
     boundary — decide which, document as an ADR).
   - Implement a concrete `Agent` adapter (interface already defined:
     `src/domain/providers/agent.ts`) and a trivial/native baseline `ContextProvider`
     (`src/domain/providers/context-provider.ts`) to prove the harness end-to-end before Phase 6's
     real ECC adapter.
   - Implement trace capture (`Trace`/`Action`/`Decision` schemas already exist — Phase 1) during
     a run.
   - Update `implementation-status.md`, `active-context.md`, [[18-current-state]], and
     [[19-phase-status]] at the end of Phase 3.

Do not start Phase 3 implementation before approval is given (master prompt §40).
