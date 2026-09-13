# 13 — Roadmap

Phases are strictly gated — see [[00-project-charter]] §Working protocol. Never self-advance to
the next phase without explicit user approval. Live status tracked in [[19-phase-status]].

| Phase | Name | Scope |
|---|---|---|
| 0 | Project Foundation | Repository setup, architecture principles, memory bank, dev standards. **← current** |
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

## Phase records

Per-phase detail (objective, implementation, decisions, limitations) lives in `phases/phase-NN.md`.
