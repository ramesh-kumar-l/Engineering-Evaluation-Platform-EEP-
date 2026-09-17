# 09 — Experiment Strategy

Status: design target for Phase 3 (Experiment Harness) and Phase 6 (ECC Integration), both now
fully realized. As of Phase 3, Condition A's building blocks have a first working implementation:
`src/harness/agents/nativeAgent.ts` (`NativeAgent`, deterministic repository exploration, no
code generation — kept only for its own harness-plumbing tests, see below) and
`src/harness/providers/nativeContextProvider.ts` (`NativeContextProvider`, task text + file
listing, no curation). As of Phase 6, Condition B/C's context source has a real implementation:
`src/harness/providers/eccContextProvider.ts` (`EccContextProvider`, wraps ECC's real CLI
contract — see [[phases/phase-06]] and ADR-010 in [[14-decisions]]). As of the Phase 6 remainder,
a real solving agent also exists: `src/harness/agents/llmSolvingAgent.ts` (`LlmSolvingAgent`,
LLM-backed, multi-provider — Claude, ChatGPT, Gemini, or a local model, per ADR-013) — and
`src/experiments/runComparisonExperiment.ts` wires it together with every condition's
`ContextProvider` for an actual comparison run against the 3 real-fixture tasks.

**Which agent plays "the agent" in the real comparison run:** `LlmSolvingAgent`, not
`NativeAgent`, and the *same* `LlmSolvingAgent` instance runs under every condition — including
the native baseline (paired with `NativeContextProvider`). This corrects an earlier, literal
reading of [[20-next-actions]] that would have kept `NativeAgent` (which performs no code
generation and always reports `INCOMPLETE`) as the baseline while only the ECC condition got a
real agent — see ADR-013 for the full reasoning. That design would have conflated "having a real
agent" with "having ECC context" into one variable, violating the causal-isolation principle
below. `NativeAgent` itself is unmodified and still used only in its own tests, proving the
harness plumbing cheaply without needing a live LLM call.

## Initial experiment conditions

**A — Native Agent**: Agent → native repository exploration → solution. Baseline. In the real
comparison run this is `LlmSolvingAgent` paired with `NativeContextProvider` — the same agent used
in every other condition, so the comparison isolates context quality, not agent capability.

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
