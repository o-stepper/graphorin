---
'@graphorin/core': patch
'@graphorin/security': patch
'@graphorin/store-sqlite': patch
---

fix(security): verifier scale traps — indexed hash lookup, bounded IP maps, honest window semantics (SPL-19)

- `AuthTokenStore` gains optional `getByHash(hashHex)`; the SQLite store
  implements it and the verifier prefers it on cache-miss (with a
  timing-safe re-check) instead of walking the full `list()` per
  verification — O(1) instead of O(n) time and memory.
- The per-IP failure/lockout maps are capped (`maxTrackedIps`, default
  10 000): overflow sweeps expired lockouts first, then evicts the oldest
  entries — an IPv6-rotating attacker can no longer inflate them without
  bound. `TokenVerifierStatus` gains `perIpFailures` for observability.
- `RateWindow`'s touch-reset (not true sliding) semantics are documented.
