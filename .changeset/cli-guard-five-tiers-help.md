---
"@graphorin/cli": patch
---

docs(cli): guard --help says five tiers; memory.ts header drops the stale migration-state claim

`graphorin guard status --help` still said "the four guard tiers" (the
`MemoryGuardTier` union has five members; the guide and `guard/types.ts` were
already corrected). Also the `memory.ts` module header still promised "counts +
active embedder + migration state" for `memory status`, which does not report
migration state. Help-string and comment changes only; no behaviour change.
