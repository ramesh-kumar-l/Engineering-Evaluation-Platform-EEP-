# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 5 (Metrics).
2. **Fixture backlog (not phase-blocking, pick up incrementally):** 27 of the 30 tasks still use
   the `"unpinned"` sentinel — only `debugging-01`, `feature-01`, `refactoring-01` have real
   fixture source code, a real `commitSha`, and now real verification coverage (Phase 3/4). Author
   the rest the same way (build in a scratch location, `git commit` for a real SHA, copy the
   working tree without `.git` into `benchmark/fixtures/<id>/`) as they're needed — most urgently
   whichever tasks a future phase needs to actually run metrics/analysis against. `feature-01` in
   particular has fixture source code but was never exercised through `executeEvaluatedRun()` in
   Phase 4 (only `debugging-01` and `refactoring-01` were) — a reasonable first target if broader
   verification coverage is wanted before Phase 5.
3. **Phase 5 (Metrics), once approved:**
   - Implement primary + secondary metrics computation from `Outcome`/`Verification`/`Evidence`/
     `Trace` records (see [[08-metrics]]) — e.g. task success rate, verification pass rate,
     actions-per-run, time-to-completion from `Run.startedAt`/`finishedAt`.
   - Populate the `Metric` schema (already defined, `src/domain/metric/metric.schema.ts`) with
     real computed values per run/experiment.
   - Decide and document how metrics aggregate across multiple runs of the same
     Task×Condition pair (mean/median, variance) — full repeated-run statistical rigor is Phase 7,
     but Phase 5's job is to define what a single metric *is* and compute it correctly for one run
     before aggregating many.
   - Update `implementation-status.md`, `active-context.md`, [[18-current-state]], and
     [[19-phase-status]] at the end of Phase 5.

Do not start Phase 5 implementation before approval is given (master prompt §40).
