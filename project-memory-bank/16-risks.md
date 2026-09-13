# 16 — Risk Register

Status values: `Open`, `Mitigated`, `Accepted`, `Closed`. All seeded `Open` in Phase 0 (none yet
mitigated since no evaluation logic exists).

| Risk | Status | Notes |
|---|---|---|
| Benchmark bias (tasks favor a particular system) | Open | Mitigation: quality rules in [[07-benchmark-strategy]]; scientific integrity rule in [[00-project-charter]]. |
| Baseline weakness (native agent baseline set up to fail) | Open | Mitigation: same harness/tools/model across conditions — [[09-experiment-strategy]]. |
| Evaluator bias (LLM-as-judge over-trusted) | Open | Mitigation: LLM-as-judge is secondary-only — [[06-evaluation-methodology]]. |
| Future-knowledge leakage (temporal contamination) | Open | Mitigation: temporal integrity policy — [[06-evaluation-methodology]], [[07-benchmark-strategy]]. |
| Nondeterminism across runs | Open | Mitigation: repeated runs, recorded seeds where applicable — [[10-reproducibility]]. |
| Agent/model version drift invalidating comparisons | Open | Mitigation: version metadata recorded per run — [[10-reproducibility]]. |
| Benchmark overfitting / metric gaming | Open | Mitigation: multi-evidence outcome evaluation, no single composite score — [[08-metrics]]. |
| Stale engineering evidence in context artifacts | Open | To be assessed once ECC integration (Phase 6) begins. |
| Privacy / secrets exposure | Open | Mitigation: local-first execution, redaction — [[11-security]]. |
| Excessive evaluation cost (time/compute) | Open | To be monitored once the harness (Phase 3) runs real experiments. |
| Dashboard complexity growing ahead of data-model maturity | Open | Mitigation: dashboard explicitly sequenced after Phase 9 — [[12-dashboard-strategy]]. |
| False confidence in small-sample results | Open | Mitigation: statistical discipline — [[06-evaluation-methodology]]. |
| Environment isolation is filesystem-copy only, not container/process sandboxed (ADR-007) | Open | Acceptable while agents only read fixtures (Phase 3); revisit before any agent executes untrusted generated commands — [[phases/phase-03]]. |

Add new risks as they're discovered; never delete a risk row, mark it `Closed` with a reason.
