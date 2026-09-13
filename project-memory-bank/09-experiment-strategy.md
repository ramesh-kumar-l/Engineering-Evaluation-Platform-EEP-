# 09 — Experiment Strategy

Status: design target for Phase 3 (Experiment Harness) and Phase 6 (ECC Integration). As of
Phase 3, Condition A's building blocks have a first working implementation:
`src/harness/agents/nativeAgent.ts` (`NativeAgent`, deterministic repository exploration, no
code generation) and `src/harness/providers/nativeContextProvider.ts`
(`NativeContextProvider`, task text + file listing, no curation). Condition B/C/D and a real
solving agent remain later work (Phase 6+).

## Initial experiment conditions

**A — Native Agent**: Agent → native repository exploration → solution. Baseline.

**B — ECC + Agent**: ECC → context → agent → solution. Primary treatment.

**C — ECC + Native Exploration**: ECC → initial context → agent exploration → solution. Tests
whether ECC context as a *seed* (rather than sole context) changes outcomes.

**D — Oracle Context**: curated expert context → agent → solution. An approximate upper-bound
reference only — must always be clearly labeled as such, never presented as an achievable
baseline.

## What each condition controls for

All four conditions share: task, repository state, model, tools, environment, evaluator version.
The only varying dimension is the `ContextProvider` (or absence thereof) — this isolates context
quality as the independent variable under test, per [[01-product-thesis]]'s primary hypothesis.
See [[06-evaluation-methodology]] §Causal reasoning discipline for confound control.

## Relationship to domain model

Each condition instantiates a `ContextProvider` (see [[04-architecture]], [[05-domain-model]])
and is one `Condition` within an `Experiment` composed of many `Run`s against the benchmark's
`Task`s ([[07-benchmark-strategy]]).
