# 12 — Dashboard Strategy

## Sequencing rule

A dashboard is feasible but is explicitly **not** the first product milestone (Phase 10+ in
[[13-roadmap]]). Build the evaluation engine and a stable result schema first.

## Data flow

```text
CLI → Evaluation Engine → Structured Results (JSON/JSONL/CSV) → Markdown Report → HTML Report → Dashboard
```

The dashboard consumes the same canonical evaluation artifacts as every other report format. It
never implements evaluation logic independently — see [[04-architecture]] layering.

## Target dashboard views (when built)

Overview (experiments, runs, success rate, quality, time, tokens, regression, human
intervention); experiment comparison (Native vs ECC, Native vs Other, ECC vs ECC-variant);
complexity analysis (L1–L5); task-category analysis; trace exploration (task → context → agent
actions → verification → outcome); failure analysis (missing/misleading context, incorrect
decisions, verification failures, regression causes); reproducibility metadata surfaced on every
result.

## Design principle

> Why should I trust this result?

Every aggregate metric must be drillable into underlying runs → trace → evidence → evaluation
decision. No black-box KPI. See [[10-reproducibility]] and [[08-metrics]] §Anti-goal.
