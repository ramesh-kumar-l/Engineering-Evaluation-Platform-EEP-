# Outcome Schema

Purpose: canonical representation of a run's final explicit status (`SUCCESS`, `TASK_FAILURE`,
`AGENT_FAILURE`, `EVALUATION_FAILURE`, `ENVIRONMENT_FAILURE`, `TIMEOUT`, `INCOMPLETE`) plus
supporting evidence (see [[05-domain-model]] `Outcome`, [[06-evaluation-methodology]]).

**Implemented:** `src/domain/outcome/outcome.schema.ts` (Zod). Version constant:
`OUTCOME_SCHEMA_VERSION` (currently `1.0.0`). The status enum itself lives in
`src/domain/common/status.ts` (`runStatusSchema`) since it is shared with `Run` semantics.
Tests: `src/domain/outcome/outcome.schema.test.ts`, `src/domain/common/status.test.ts`.

`status` is a required field with no default — an omitted status is a validation error, not a
silent `SUCCESS`, per [[06-evaluation-methodology]] §Explicit failure taxonomy.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
