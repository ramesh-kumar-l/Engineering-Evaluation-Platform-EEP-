# Evaluation Schema

Purpose: the judged result of applying Verification + Metrics to a Run's Outcome, versioned
against an evaluator version (see [[05-domain-model]] `Evaluation`).

**Implemented:** `src/domain/evaluation/evaluation.schema.ts` (Zod). Version constant:
`EVALUATION_SCHEMA_VERSION` (currently `1.0.0`). `supersedesEvaluationId` implements the
correction-lineage requirement in [[10-reproducibility]] §Immutability policy — a correction is
a new Evaluation record, never a mutation of the original. Tests:
`src/domain/evaluation/evaluation.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
