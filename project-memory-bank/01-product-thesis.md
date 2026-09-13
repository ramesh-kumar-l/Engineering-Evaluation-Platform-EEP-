# 01 — Product Thesis

## Core question

> Does an AI-assisted engineering system actually improve software-engineering outcomes?

## The chain EEP must evaluate

```text
Task → Context → Understanding → Decision → Action → Verification → Outcome → Long-Term Effect
```

EEP must measure more than "did the agent generate plausible-looking code." It must evaluate, at
minimum: task success, engineering correctness, engineering quality, regression risk,
verification quality, context quality, context efficiency, agent behavior, human intervention,
time to correct outcome, resource consumption, reproducibility, risk, and long-term engineering
implications where measurable. See [[08-metrics]] for the concrete metric set.

## Primary hypothesis (falsifiable)

> Providing an AI coding agent with ECC-generated engineering context improves engineering task
> outcomes compared with native agent repository exploration alone.

EEP must be capable of disproving this hypothesis. This is not a marketing claim to be defended;
it is a scientific claim to be tested. See [[09-experiment-strategy]] for the experiment designs
(Native, ECC+Agent, ECC+Exploration, Oracle) used to test it, and [[15-assumptions]] for the
assumptions this hypothesis rests on.

## North-star principle

> Minimum sufficient context + correct engineering decision + safe engineering outcome.

Do not optimize blindly for fewer tokens, fewer tool calls, fewer files, shorter prompts, or
lower latency. A smaller context that causes a worse engineering decision is a failure. Context
efficiency ([[08-metrics]]) is always subordinate to engineering correctness and safety.

## Relationship to ECC

- ECC asks: *what engineering context should an AI agent have?*
- EEP asks: *did that context actually improve the engineering outcome?*

ECC = system under evaluation. EEP = evaluation system. See [[00-project-charter]] for the hard
repository-boundary constraint this implies, and [[04-architecture]] for the `ContextProvider`
abstraction that keeps EEP decoupled from ECC internals.
