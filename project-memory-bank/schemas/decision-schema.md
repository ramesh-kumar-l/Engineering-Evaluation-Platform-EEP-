# Decision Schema

Purpose: a point where the agent chose an approach, captured for later quality/risk analysis
(see [[05-domain-model]] `Decision`).

**Implemented:** `src/domain/trace/decision.schema.ts` (Zod). Version constant:
`DECISION_SCHEMA_VERSION` (currently `1.0.0`). Embedded by reference within a `Trace`'s
`decisions` array — see [[schemas/trace-schema]]. Tests:
`src/domain/trace/decision.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
