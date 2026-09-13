# 20 — Next Actions

1. **Immediate:** await explicit user approval to begin Phase 2.
2. **Phase 2 (Benchmark V1), once approved:**
   - Design the ~30-task benchmark per [[07-benchmark-strategy]]'s category/complexity
     distribution, using the existing `taskSchema` (`src/domain/task/task.schema.ts`) as the
     storage format — extend it (bump `TASK_SCHEMA_VERSION`) only if a real gap appears.
   - Establish ground truth and a verification method per task, consistent with
     [[06-evaluation-methodology]]'s "tests pass" vs "outcome correct" distinction.
   - Fully specify the temporal-integrity policy referenced in [[07-benchmark-strategy]] and
     [[06-evaluation-methodology]].
   - Decide where benchmark task files live on disk (likely a `benchmark/` directory, one file
     per task) and how they're loaded/validated against `taskSchema` at load time.
   - Update `implementation-status.md`, `active-context.md`, [[18-current-state]], and
     [[19-phase-status]] at the end of Phase 2.

Do not start Phase 2 implementation before approval is given (master prompt §40).
