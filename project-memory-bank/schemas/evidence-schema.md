# Evidence Schema

Purpose: a discrete piece of information (file, test result, doc snippet, provenance record)
used to support a Decision or an Evaluation (see [[05-domain-model]] `Evidence`).

**Implemented:** `src/domain/evidence/evidence.schema.ts` (Zod). Version constant:
`EVIDENCE_SCHEMA_VERSION` (currently `1.0.0`). Supports the configurable-redaction requirement
in [[11-security]] via `redacted`. Tests: `src/domain/evidence/evidence.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
