# 13 — Roadmap

Phases are strictly gated — see [[00-project-charter]] §Working protocol. Never self-advance to
the next phase without explicit user approval. Live status tracked in [[19-phase-status]].

| Phase | Name | Scope |
|---|---|---|
| 0 | Project Foundation | Repository setup, architecture principles, memory bank, dev standards. |
| 1 | Evaluation Contract | Domain objects, schemas, versioning, artifact model. |
| 2 | Benchmark V1 | Task schema, benchmark structure, 30 tasks, ground truth, verification. |
| 3 | Experiment Harness | Agent adapter, context-provider adapter, environment isolation, trace capture. |
| 4 | Deterministic Evaluation | Correctness, tests, regression, scope, verification. |
| 5 | Metrics | Primary metrics, secondary metrics, aggregation. |
| 6 | ECC Integration | ECC adapter, native baseline, ECC treatment, controlled comparison. |
| 7 | Experimental Analysis | Repeated runs, complexity analysis, category analysis, failure analysis. |
| 8 | Ablation | ECC component analysis. |
| 9 | Reporting | JSON, CSV, Markdown, HTML. |
| 10 | Dashboard Feasibility / MVP | Only after the data layer stabilizes. |
| 11 | Public Benchmark | Benchmark documentation, reproducibility, public results. |
| 12 | External Reproduction | External users, independent runs, comparison. |
| 13 | CI / GitHub Integration | Only after the core system is reliable. |

**Actual status:** Phases 0–10 are complete (299 tests passing across 78 files) — see
[`19-phase-status.md`](19-phase-status.md) for the phase-by-phase ledger and
[`20-next-actions.md`](20-next-actions.md) for what's open (executing a live comparison run,
Phase 11+, or deferred scope within Phases 7/9/10). This table is never edited to mark a phase
"current" — [[19-phase-status]] is the live source of truth for that.

## Phase records

Per-phase detail (objective, implementation, decisions, limitations) lives in `phases/phase-NN.md`.
