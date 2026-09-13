# 05 — Domain Model

The fundamental unit of EEP is the **Engineering Task** — not a prompt, a file, a repository, a
model, or an agent. Those are dimensions along which a task is evaluated.

Concrete schemas (TypeScript types / Zod validation) are implemented as of Phase 1 (Evaluation
Contract) under `src/domain/`, one subdirectory per entity family — see `project-memory-bank/
schemas/*.md` for pointers to the exact source file and version constant per entity. This file
continues to record only the conceptual entities and their responsibilities; it is the fixed
target the Phase 1 implementation was built against and stays the reference for future schema
changes.

| Entity | Responsibility |
|---|---|
| `Task` | Canonical, versioned unit of engineering work to be attempted: description, repository/commit, category, complexity, acceptance criteria, verification method, ground truth. |
| `Experiment` | Composition of Task + repository state + agent + model + context provider + tools + environment + config + evaluation version; declares baseline/treatment/controls/variables. |
| `Condition` | One specific arm of an experiment (e.g. "Native", "ECC+Agent") to be compared against others. |
| `Run` | A single execution of a Condition against a Task; the unit that produces a Trace and an Outcome. |
| `Trace` | Full captured lifecycle of one run: context received, agent reasoning/actions, tool calls, files read/changed, commands, tests, retries, verification, final outcome. |
| `Evidence` | A discrete piece of information (a file, a test result, a doc snippet, provenance record) used to support a Decision or an Evaluation. |
| `ContextArtifact` | The concrete context payload handed to the agent by a `ContextProvider` for a given run. |
| `Decision` | A point where the agent chose an approach; captured for later quality/risk analysis. |
| `Action` | A concrete agent action (edit, command, tool call) taken during a run. |
| `Verification` | The check(s) applied to determine whether a run's output satisfies the Task's acceptance criteria. |
| `Outcome` | The final, explicit status of a run (see status enum in [[04-architecture]]) plus supporting evidence. |
| `Metric` | A single measured quantity (see [[08-metrics]]) computed from a Run/Trace/Outcome. |
| `Evaluation` | The judged result of applying Verification + Metrics to a Run's Outcome, versioned against an evaluator version. |
| `Report` | A human/machine-readable aggregation of Evaluations across Runs/Experiments. |

## Provider abstraction

`ContextProvider` is the generic interface that both "native agent exploration" and ECC (and any
future context source, e.g. RAG/memory systems, oracle/human-curated context) implement. See
[[04-architecture]] and [[09-experiment-strategy]].
