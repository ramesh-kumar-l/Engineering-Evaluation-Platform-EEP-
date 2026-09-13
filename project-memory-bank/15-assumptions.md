# 15 — Assumption Management

Status values: `Untested`, `Under Test`, `Supported`, `Mixed`, `Rejected`. All start `Untested`
in Phase 0.

| Assumption | Status |
|---|---|
| Structured engineering context affects agent outcomes | Untested |
| ECC improves context quality relative to no context provider | Untested |
| Native agent repository exploration is an appropriate baseline | Untested |
| Engineering outcomes can be measured with the metric set in [[08-metrics]] | Untested |
| Automated tests are sufficient evidence for some classes of tasks | Untested |
| Context reduction does not necessarily improve outcomes (north-star principle) | Untested |
| The magnitude of any context benefit varies by task complexity (L1–L5) | Untested |
| The magnitude of any context benefit varies by model | Untested |
| The magnitude of any context benefit varies by repository | Untested |
| Developers/organizations value the measured improvement, if any | Untested |

Update statuses as experiments (Phase 6+) produce evidence. Never silently drop an assumption
that becomes `Rejected` — record it and its implications in [[17-known-limitations]].
