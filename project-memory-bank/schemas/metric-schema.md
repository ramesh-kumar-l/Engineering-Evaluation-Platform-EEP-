# Metric Schema

Purpose: canonical representation of a single measured quantity computed from a Run/Trace/Outcome
(see [[05-domain-model]] `Metric`, [[08-metrics]]).

**Implemented:** `src/domain/metric/metric.schema.ts` (Zod). Version constant:
`METRIC_SCHEMA_VERSION` (currently `1.0.0`). `PRIMARY_METRIC_NAMES` and `SECONDARY_METRIC_NAMES`
enumerate the exact metric names from [[08-metrics]] — the metric *name* enum is authoritative
here; metric *computation logic* is Phase 5 work. Tests: `src/domain/metric/metric.schema.test.ts`.

Per [[08-metrics]] §Anti-goal, this schema deliberately has no composite-score field — every
metric record stays individually drillable to its run.

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
