# Metric Schema

Purpose: canonical representation of a single measured quantity computed from a Run/Trace/Outcome
(see [[05-domain-model]] `Metric`, [[08-metrics]]).

**Implemented:** `src/domain/metric/metric.schema.ts` (Zod). Version constant:
`METRIC_SCHEMA_VERSION` (currently `1.0.0`). `PRIMARY_METRIC_NAMES` and `SECONDARY_METRIC_NAMES`
enumerate the exact metric names from [[08-metrics]] — the metric *name* enum is authoritative
here; metric *computation logic* is Phase 5 work. Tests: `src/domain/metric/metric.schema.test.ts`.

Per [[08-metrics]] §Anti-goal, this schema deliberately has no composite-score field — every
metric record stays individually drillable to its run.

**Computed by (Phase 5):** `src/metrics/computeMetrics.ts`'s `computeRunMetrics()`, using
`primaryMetrics.ts` (all 5 primary metrics) and `secondaryMetrics.ts` (9 of 17 secondary metrics
— the other 8 have no data source yet). `aggregateMetrics.ts`'s `aggregateMetricsByName()` gives a
lightweight, explicitly non-statistical mean/median/stddev summary across repeated runs of the
same Task×Condition pair. See [[phases/phase-05]] and ADR-009 in [[14-decisions]].

This file intentionally does not restate fields — see [[10-reproducibility]] §Independent
versioning axes.
