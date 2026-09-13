# Experiment Schema

Purpose: canonical representation of an experiment — Task(s) + agent + model + conditions +
evaluator/benchmark version (see [[05-domain-model]] `Experiment`, [[09-experiment-strategy]]).
`Condition` (one arm of an experiment, e.g. "Native", "ECC+Agent") is a related but separate
schema, since conditions are shared/reused across experiments.

**Implemented:**
- `src/domain/experiment/experiment.schema.ts` — version constant `EXPERIMENT_SCHEMA_VERSION`
  (currently `1.0.0`). Tests: `src/domain/experiment/experiment.schema.test.ts`.
- `src/domain/experiment/condition.schema.ts` — version constant `CONDITION_SCHEMA_VERSION`
  (currently `1.0.0`). Tests: `src/domain/experiment/condition.schema.test.ts`.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
