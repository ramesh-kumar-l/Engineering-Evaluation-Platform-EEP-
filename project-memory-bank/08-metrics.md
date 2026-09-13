# 08 — Metrics

Status: target metric set for Phase 5 (Metrics). Not yet implemented as of Phase 0.

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

Evidence recall, evidence precision, evidence authority, evidence freshness, provenance
completeness, context redundancy, context tokens, tool calls, agent turns, files read, files
changed, failed attempts, retries, regression rate, verification completeness, risk
classification, decision confidence.

## Anti-goal

Do not collapse these into one meaningless composite score. Every aggregate must remain
drillable to underlying runs/traces — see [[12-dashboard-strategy]] §Design principle.
