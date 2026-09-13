# Run Schema

Purpose: canonical representation of a single execution of a Condition against a Task, including
all reproducibility metadata (see [[05-domain-model]] `Run`, [[10-reproducibility]]).

**Implemented:** `src/domain/run/run.schema.ts` (Zod). Version constant: `RUN_SCHEMA_VERSION`
(currently `1.0.0`). The nested `runMetadataSchema` encodes every field listed in
[[10-reproducibility]] §Required run metadata. Tests: `src/domain/run/run.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
