# Report Schema

Purpose: a human/machine-readable aggregation of Evaluations across Runs/Experiments (see
[[05-domain-model]] `Report`, [[12-dashboard-strategy]]).

**Implemented:** `src/domain/report/report.schema.ts` (Zod). Version constant:
`REPORT_SCHEMA_VERSION` (currently `1.0.0`). `limitations` exists to enforce
[[06-evaluation-methodology]] §Statistical discipline — every report names its limitations
rather than making unqualified claims. Tests: `src/domain/report/report.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
