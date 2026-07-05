---
'@graphorin/core': minor
'@graphorin/store-sqlite': patch
'@graphorin/cli': minor
---

Reachable retention lever for `memory_history` (W-066):

- `@graphorin/core`: new `MemoryStoreExt` contract (`extends MemoryStore` with `pruneHistory(olderThanMs)`), mirroring the `SessionStoreExt` precedent - strictly additive, custom `MemoryStore` implementations keep compiling. The TSDoc pins the unit semantics: the argument is an AGE in milliseconds, never an epoch cutoff.
- `@graphorin/store-sqlite`: `SqliteMemoryStore` declares `implements MemoryStoreExt` and `GraphorinSqliteStore.memory` is now typed `MemoryStoreExt`, so `pruneHistory` is reachable without casts.
- `@graphorin/cli`: new `graphorin memory prune-history --older-than <duration|date>` command. `--older-than` is mandatory (destructive by design, no default), takes a duration (`30d`, `12h`) or a PAST ISO date (converted to `now - date`; future dates are refused - they would prune the whole table). Documented in the CLI guide and the memory-system guide: history grows by design, `purge()` already scrubs sensitive text, pruning is storage-cost hygiene.
