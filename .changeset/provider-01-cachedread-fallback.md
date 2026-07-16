---
"@graphorin/pricing": patch
---

fix(pricing): PROVIDER-01 bill cached reads at the input rate when the entry declares no cached-read price

`calculateCost` silently billed `cachedReadTokens` at $0 whenever the snapshot
entry lacked a `cachedReadUsdPerToken`. It now falls back to the full input rate
(mirroring the documented cache-write leg), so cached reads are never
under-billed to zero.
