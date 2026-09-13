# 04 — Architecture

## EEP / ECC boundary

```text
                    EEP
                     │
              Evaluation Contract
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Native       ECC      Other
       Agent     Provider    Provider
          │          │          │
          └──────────┼──────────┘
                     ↓
                   Agent
                     ↓
                   Trace
                     ↓
                  Outcome
                     ↓
                Evaluation
```

ECC (and any future context source) implements a single, generic `ContextProvider` contract.
EEP's core never imports, forks, or depends on ECC internals — only on this contract and
whatever external interface (CLI/API/artifact) ECC exposes. See [[00-project-charter]] for why
this boundary is a hard constraint, not a style preference.

## Layering (target shape, built incrementally by phase)

```text
CLI
 ↓
Evaluation Engine   (experiment harness, run orchestration)
 ↓
Domain Model        (Task, Experiment, Run, Trace, Outcome, Metric, ... — see 05-domain-model.md)
 ↓
Adapters            (ContextProvider impls, Agent impls, Evaluator impls)
 ↓
Structured Results  (JSON / JSONL / CSV)
 ↓
Reports             (Markdown / HTML)
 ↓
Dashboard           (later phase; reads canonical artifacts only, owns no evaluation logic)
```

Each layer only depends on the layer(s) below it through explicit types/contracts, never on
concrete adapter implementations.

## Technology selection (Phase 0 decision — see [[14-decisions]] for full ADR)

- **Language/runtime:** TypeScript on Node.js (>=20). Chosen by the user over Python and Go.
  Rationale: strong JSON/schema tooling for the evaluation-artifact-heavy domain model, easy CLI
  ergonomics, straightforward subprocess orchestration for invoking agents/ECC, one language
  across CLI, adapters, and (later) dashboard.
- **Module system:** ESM (`"type": "module"`), NodeNext resolution.
- **Test runner:** Vitest — native ESM/TS support, fast, no separate ts-jest transpilation step.
- **Lint/format:** ESLint (flat config, typescript-eslint recommended rules) + Prettier.
- **No database, no message queue, no microservices, no cloud infra** until a real requirement
  demonstrates the need (master prompt §54, §60). Local-first: results are files on disk
  (JSON/JSONL/CSV/Markdown/HTML), not rows in a service.

## Domain model

See [[05-domain-model]] for the canonical entities. Concrete TypeScript types/schemas are Phase 1
work (Evaluation Contract), not Phase 0.

## Integration mechanism with ECC (decided and implemented, Phase 6)

CLI subprocess invocation: `EccContextProvider` (`src/harness/providers/eccContextProvider.ts`)
shells out to ECC's own published `ecc context "<task>" --path <dir> [--budget <n>]` command and
parses/validates its stdout JSON against an independent Zod mirror of ECC's documented
`EngineeringContextPackage` contract (`eccPackageSchema.ts`) — never an import of ECC's TS
source. The invoked command is fully configurable (constructor options / `ECC_CLI_COMMAND` env
var), so no EEP code bakes in a path to any one machine's ECC checkout. See [[phases/phase-06]]
and ADR-010 in [[14-decisions]] for the full reasoning and trade-offs.

## Observability & error semantics

Distinguish `SUCCESS`, `TASK_FAILURE`, `AGENT_FAILURE`, `EVALUATION_FAILURE`,
`ENVIRONMENT_FAILURE`, `TIMEOUT`, `INCOMPLETE` as explicit statuses from day one of the
Evaluation Contract (Phase 1) — never collapse infrastructure failures into task/agent failures.
See [[06-evaluation-methodology]].
