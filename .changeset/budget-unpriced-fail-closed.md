---
'@graphorin/agent': minor
---

BREAKING (opt-out available): `RunBudget.maxCostUsd` is now fail-closed when the usage carries no USD cost data. Previously an unpriced cost ceiling logged one WARN and ran unmetered - a caller who set a cost cap kept spending with no enforcement. The new `RunBudget.onUnpriced` defaults to `'fail'`: the run stops at the first between-step check (`'stop'` fails the run with `error.code: 'budget-unpriced'`; `'throw'` rejects with the new `AgentBudgetUnpricedError`). Restore the pre-0.13 warn-once behaviour with `RunBudget.onUnpriced: 'warn'`, or wire `withCostTracking` (`@graphorin/provider`) with a `@graphorin/pricing` snapshot so the ceiling can observe real spend. Found by the 2026-07-19 deep retest (P1-3): current cloud models missing from the bundled snapshot left `maxCostUsd` silently unenforced.
