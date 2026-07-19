---
'@graphorin/pricing': patch
---

Add the GPT-5.6 family (gpt-5.6-luna, gpt-5.6-terra, gpt-5.6-sol) to the bundled pricing snapshot at the official standard short-context rates, and bump the snapshot date to 2026-07-19. Without these entries `lookupPrice` returned null for the current OpenAI line, so a `RunBudget.maxCostUsd` fed by these models could not observe spend (deep retest 2026-07-19, P1-3). Models released after the snapshot date still resolve to null + WARN by design - refresh via `refreshPricing(...)` or contribute the entry when pricing is public.
