# 06 — Evaluation Methodology

## Core distinction

"Tests pass" is NOT the same claim as "the engineering outcome is correct." EEP must evaluate the
latter, using the former as one signal among several.

## Multi-evidence outcome evaluation

Prefer combining, where available: tests, static analysis, diff analysis, repository invariants,
acceptance criteria checks, security checks, architecture checks, and (optionally, for
high-value/ambiguous cases) human expert review.

**LLM-as-judge may be used as a secondary evaluator only — never as the sole authority for an
important engineering outcome.**

## Explicit failure taxonomy

Never silently convert "evaluation unavailable" into "evaluation failed," or "agent failed" into
"task incorrect." Use explicit statuses: `SUCCESS`, `TASK_FAILURE`, `AGENT_FAILURE`,
`EVALUATION_FAILURE`, `ENVIRONMENT_FAILURE`, `TIMEOUT`, `INCOMPLETE`. Infrastructure failures are
never classified as agent failures. See [[04-architecture]] §Observability.

## Causal reasoning discipline

For any claim of the form "X improved Y," explicitly ask what alternative explanation could
produce the same observation, and control for model, agent, repository, task, environment,
tools, benchmark, and evaluator where possible. Document remaining confounders rather than
ignoring them. See [[16-risks]] and [[15-assumptions]].

## Statistical discipline

Do not make strong claims from a tiny sample. Every public report must state limitations.
Prefer "evidence supports an improvement in this benchmark under these conditions" over
absolute claims like "X makes agents 20% better." Target methodology (built in Phase 7+):
repeated runs, paired comparisons, confidence intervals, effect size, variance, task
segmentation, failure analysis, ablation analysis.

## Ablation discipline (Phase 8+)

When decomposing a context provider (e.g. ECC) into components (history, memory, ranking,
provenance, risk, budgeting, verification), do not assume every component adds value — measure
each.

## Temporal integrity

When evaluating a historical repository state, consider repository SHA, task creation date, and
what evidence was actually available at that historical point. An agent must not receive
information created after the evaluated task's historical state if that would constitute unfair
advantage. Fully specified alongside the benchmark in Phase 2 — see [[07-benchmark-strategy]]
§Temporal integrity policy.
