# 08 — Metrics

Status: target metric set, implemented (with documented gaps) as of Phase 5 — see
`src/metrics/`, [[phases/phase-05]], and ADR-009 in [[14-decisions]]. All 5 primary metrics and 9
of 17 secondary metrics are computed; the remaining 8 secondary metrics below are marked `(not
computed — see ADR-009)` where no real data source exists yet.

## Primary metrics (five)

1. **Task Success** — did the task reach the required correct outcome?
2. **Engineering Quality** — was the solution correct, safe, maintainable, appropriately scoped,
   architecturally consistent?
3. **Time to Correct Outcome** — time until the task reaches an acceptable verified outcome.
4. **Context Efficiency** — relationship between useful decision-relevant context and context
   cost (never optimized in isolation — see [[01-product-thesis]] north-star principle).
5. **Human Intervention** — how much human intervention was required. Not automatically a
   failure signal: for high-risk tasks, appropriate human intervention may be desirable.

## Secondary metrics

Evidence recall (not computed — see ADR-009), evidence precision (not computed — see ADR-009),
evidence authority (not computed — see ADR-009), evidence freshness (not computed — see ADR-009),
provenance completeness, context redundancy (not computed — see ADR-009), context tokens, tool
calls, agent turns, files read, files changed, failed attempts, retries, regression rate (not
computed — see ADR-009), verification completeness, risk classification (not computed — see
ADR-009), decision confidence (not computed — see ADR-009).

## Anti-goal

Do not collapse these into one meaningless composite score. Every aggregate must remain
drillable to underlying runs/traces — see [[12-dashboard-strategy]] §Design principle.
