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
| Stale engineering evidence in context artifacts | Open | Assessed at Phase 6: ECC's documented package contract does carry a per-evidence-item `provenance.freshness` (`current`/`stale`/`unknown`) field, but `EccContextProvider` currently stores the whole validated package as opaque `ContextArtifact.content` text — nothing yet reads that field to flag or downweight stale evidence. Tracked as a future metrics/evidence-pipeline enhancement, see [[20-next-actions]]. |
| ECC CLI as an external, versioned dependency EEP does not control | Open | New at Phase 6. `EccContextProvider` validates every invocation's output against EEP's own schema mirror (`eccPackageSchema.ts`) and fails loudly (`EccInvocationError`) rather than silently degrading if ECC's contract changes shape — see ADR-010, [[phases/phase-06]]. The command invoked is configurable, never hardcoded, so a broken/missing ECC checkout on one machine can't silently corrupt results on another. |
| Privacy / secrets exposure | Open | Mitigation: local-first execution, redaction — [[11-security]]. |
| Excessive evaluation cost (time/compute) | Open | To be monitored once the harness (Phase 3) runs real experiments. |
| Dashboard complexity growing ahead of data-model maturity | Open | Mitigation: dashboard explicitly sequenced after Phase 9 — [[12-dashboard-strategy]]. |
| False confidence in small-sample results | Open | Mitigation: statistical discipline — [[06-evaluation-methodology]]; Phase 5's `aggregateMetricsByName()` deliberately stays non-statistical (mean/median/stddev only, no significance testing) rather than implying rigor it can't back up — see [[phases/phase-05]], ADR-009. |
| Environment isolation is filesystem-copy only, not container/process sandboxed (ADR-007) | Open | Acceptable while agents only read fixtures (Phase 3); sharpened in Phase 4 — `testSuiteVerifier` now spawns real child processes with a wall-clock timeout but no CPU/memory limits, still acceptable for small, trusted, self-authored fixtures with no dependencies; revisit before any agent executes untrusted generated commands — [[phases/phase-03]], [[phases/phase-04]]. |

Add new risks as they're discovered; never delete a risk row, mark it `Closed` with a reason.
