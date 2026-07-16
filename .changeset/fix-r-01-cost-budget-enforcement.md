---
'@graphorin/provider': patch
---

Fix `RunBudget.maxCostUsd` failing open with the documented wiring (e2e 2026-07-13, R-01 / AGENT-RU-01 / OBS-PRIC-03, major; confirmed live). `withCostTracking` computed a per-call cost but only surfaced it on the `onUsage` hook - it never stamped `usage.cost` onto the `finish` event the agent run loop accumulates, so `state.usage.cost` stayed undefined, `RunBudget.maxCostUsd` was never enforced, and the runtime warned the ceiling was UNENFORCED even though every call was priced. When a `priceLookup` is configured, the middleware now stamps the computed cost onto the returned usage (both the streamed `finish` event and the `generate()` result), so the run loop's `accumulateUsage` folds it into `state.usage.cost` and the cost ceiling enforces as documented. A provider-reported `usage.cost` (no `priceLookup`) is left untouched. New regression tests pin the stamping on both paths, with and without an `onUsage` hook.
