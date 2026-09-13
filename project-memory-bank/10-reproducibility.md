# 10 — Reproducibility

## Required run metadata (minimum)

Task ID, task version, repository SHA, agent, agent version, model, model version (if
available), context provider, context provider version, EEP version, evaluator version,
benchmark version, experiment configuration, environment, tool configuration, timestamp, random
seed (where applicable). To be encoded in [[schemas/run-schema]] during Phase 1.

## Independent versioning axes

EEP, benchmark, evaluator, metrics, schemas, experiments, and reports are each versioned
independently (see [[14-decisions]]). A result must be interpretable years later purely from its
recorded metadata.

## Immutability policy

A finalized evaluation run is not silently modified once complete. If a correction is needed:
retain the original result, record correction metadata, and associate the correction with a new
evaluator version — full lineage stays traceable. See [[06-evaluation-methodology]] for the
failure-status taxonomy that keeps "infrastructure incomplete" distinct from "finalized result."

## Why this matters

Every public claim EEP produces (via `eep prove` or otherwise) must be traceable back through
report → aggregate metric → individual run → trace → evidence → evaluation decision. See
[[12-dashboard-strategy]] §Design principle ("no black-box KPI").
