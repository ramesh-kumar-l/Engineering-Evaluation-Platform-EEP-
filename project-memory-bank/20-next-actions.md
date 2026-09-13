# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 4.
2. **Fixture backlog (not phase-blocking, pick up incrementally):** 27 of the 30 tasks still use
   the `"unpinned"` sentinel — only `debugging-01`, `feature-01`, `refactoring-01` have real
   fixture source code and a real `commitSha` (Phase 3, see ADR-007 in [[14-decisions]]). Author
   the rest the same way (build in a scratch location, `git commit` for a real SHA, copy the
   working tree without `.git` into `benchmark/fixtures/<id>/`) as they're needed — most urgently
   whichever tasks Phase 4 first needs to actually execute verification against.
3. **Phase 4 (Deterministic Evaluation), once approved:**
   - Implement verification execution: turn each task's descriptive `verificationMethod` into
     real, running checks (`test-suite`, `diff-analysis`, etc. per
     `src/domain/verification/verification.schema.ts`'s enum) that produce a `Verification`
     record.
   - Implement `Outcome` construction from one or more `Verification` results, using the full
     `RunStatus` taxonomy — never collapse an infrastructure failure into `TASK_FAILURE`/
     `AGENT_FAILURE` (see [[06-evaluation-methodology]]).
   - Wire the harness's `agentReportedStatus` (Phase 3, provenance-only) alongside the new
     evaluator-determined `Outcome.status` (authoritative) so both are visible without ever being
     conflated.
   - Extend the harness (`src/harness/runHarness.ts`) or a new orchestration layer to run
     verification immediately after `executeRun()` for tasks that have a real fixture.
   - Update `implementation-status.md`, `active-context.md`, [[18-current-state]], and
     [[19-phase-status]] at the end of Phase 4.

Do not start Phase 4 implementation before approval is given (master prompt §40).
