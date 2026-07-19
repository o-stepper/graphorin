---
'@graphorin/pricing': patch
---

GPT-5.6 pricing is now complete against the official OpenAI price page: the three snapshot entries carry the explicit `cacheWriteUsdPerToken` premium (1.25x input: $1.25 / $3.125 / $6.25 per 1M for luna / terra / sol), so cache-write tokens are no longer under-billed 20% via the input-rate fallback, and a fourth entry prices the bare `gpt-5.6` alias at sol rates (the API routes `gpt-5.6` to `gpt-5.6-sol`), so `lookupPrice`/`calculateCost`/the CLI no longer miss on the alias. A fixture test pins `calculateCost` to the official four-leg formula (base input + cached read + cache write + output).
