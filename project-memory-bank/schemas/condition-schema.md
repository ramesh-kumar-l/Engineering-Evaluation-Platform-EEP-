# Condition Schema

Purpose: one specific arm of an experiment (e.g. "Native", "ECC+Agent") to be compared against
others (see [[05-domain-model]] `Condition`, [[09-experiment-strategy]]).

**Implemented:** `src/domain/experiment/condition.schema.ts` (Zod). Version constant:
`CONDITION_SCHEMA_VERSION` (currently `1.0.0`). `isOracle` must be `true` for any condition using
curated/expert context, so reporting layers can never present an oracle result as an achievable
baseline (see [[09-experiment-strategy]] §Condition D). Tests:
`src/domain/experiment/condition.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
