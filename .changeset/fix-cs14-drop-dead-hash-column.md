---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): drop the dead facts.hash column + index (CS-14)

Migration 001 declared `facts.hash TEXT` ("the dedup key") and
`idx_facts_hash`, but the only write path bound `NULL` unconditionally and
nothing ever read the column — stage-1 exact dedup recomputes its digest
in-process. It was inert schema: a perpetually-NULL column and an index over it.

Migration 023 drops the index (required before SQLite will drop a referenced
column) and then the column; the facts `INSERT` no longer lists `hash`, and the
internal `FactRow` type drops the field. 001 is checksum-locked, so the removal
ships as a forward migration rather than an edit to it.

Red-first: a real-sqlite test asserts neither `facts.hash` nor `idx_facts_hash`
exists after migration, and that `remember` + FTS `search` still round-trip.
