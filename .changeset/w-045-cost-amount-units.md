---
'@graphorin/core': patch
'@graphorin/pricing': patch
---

W-045: the `Cost.amount` units contract is now consistent across the ecosystem - and it is WHOLE currency units (for USD: dollars, fractional values expected), never "smallest fractional unit" / cents as the core TSDoc previously claimed. The canonical producer `calculateCost` (@graphorin/pricing), `CostTracker` snapshots (@graphorin/observability) and the memory consolidator's `costUsd` all already operated in dollars; a consumer that followed the old doc and divided by 100 was off by 100x. Docs-only for the code paths, with a numeric pin test (1M input tokens at $5/Mtok = exactly `5`) freezing the convention. If you implemented a minor-units conversion against the old wording, remove it.
