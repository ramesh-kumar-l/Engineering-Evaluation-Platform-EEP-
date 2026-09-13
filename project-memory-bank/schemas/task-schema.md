# Task Schema

Purpose: canonical, versioned representation of an engineering task (see [[05-domain-model]]
`Task`, [[07-benchmark-strategy]]).

**Implemented:** `src/domain/task/task.schema.ts` (Zod). Version constant: `TASK_SCHEMA_VERSION`
(currently `1.0.0`). Tests: `src/domain/task/task.schema.test.ts`.

This file intentionally does not restate fields — the TS source is the single source of truth,
per [[10-reproducibility]] §Independent versioning axes (a duplicated markdown spec would drift).
Bump `TASK_SCHEMA_VERSION` on any breaking field change and record the change in [[14-decisions]].
