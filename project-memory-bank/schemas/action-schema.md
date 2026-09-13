# Action Schema

Purpose: a concrete agent action (edit, command, tool call) taken during a run (see
[[05-domain-model]] `Action`).

**Implemented:** `src/domain/trace/action.schema.ts` (Zod). Version constant:
`ACTION_SCHEMA_VERSION` (currently `1.0.0`). Embedded by reference within a `Trace`'s `actions`
array — see [[schemas/trace-schema]]. Tests: `src/domain/trace/action.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
