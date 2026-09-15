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
absolute claims like "X makes agents 20% better." Target methodology: repeated runs, paired
comparisons, confidence intervals, effect size, variance, task segmentation, failure analysis,
ablation analysis. As of Phase 7, `src/analysis/` (`analyzeRepeatedRuns()`) implements confidence
intervals (Student's t for continuous metrics, Wilson score interval for the proportion metric
`task-success`), effect size (Cohen's d / Cohen's h, classified negligible/small/medium/large),
and task-category/complexity segmentation — see [[phases/phase-07]] and ADR-011 in
[[14-decisions]]. Failure analysis and ablation analysis (Phase 8) remain open.

## Ablation discipline (Phase 8+)

When decomposing a context provider (e.g. ECC) into components (history, memory, ranking,
provenance, risk, budgeting, verification), do not assume every component adds value — measure
each. As of Phase 8, `src/harness/providers/eccAblation.ts` maps each of these 7 components onto a
real field of ECC's own documented package contract and produces one ablated `ContextProvider`
Condition per component (`AblatedEccContextProvider`); `src/analysis/componentContribution.ts`
(`analyzeComponentContributions()`) measures each one's contribution by reusing Phase 7's
`analyzeRepeatedRuns()` unchanged — see [[phases/phase-08]] and ADR-012 in [[14-decisions]]. This
is content-level (black-box) ablation of ECC's CLI output, not a measurement of ECC's actual
internal architecture — a documented limitation, not an assumed one.

## Temporal integrity

When evaluating a historical repository state, consider repository SHA, task creation date, and
what evidence was actually available at that historical point. An agent must not receive
information created after the evaluated task's historical state if that would constitute unfair
advantage. Fully specified alongside the benchmark in Phase 2 — see [[07-benchmark-strategy]]
§Temporal integrity policy.
