# 17 — Known Limitations

As of Phase 0:

- No evaluation engine, benchmark, metrics, or CLI commands exist yet — only repository
  scaffolding and this memory bank.
- No ECC adapter exists; the `ContextProvider` contract is conceptual only ([[04-architecture]],
  [[05-domain-model]]), not yet implemented in code.
- No benchmark tasks exist; the 30-task target ([[07-benchmark-strategy]]) is a design target.
- Single-contributor project at this stage; no independent review of methodology yet.
- No CI/automated checks configured yet (Phase 13).
- All assumptions in [[15-assumptions]] are `Untested`.
- The statistical/ablation methodology ([[06-evaluation-methodology]]) is described at a
  conceptual level only; no implementation exists to validate it against real data yet.

Every public report EEP eventually produces must inherit the currently-relevant subset of these
limitations (master prompt §47).
