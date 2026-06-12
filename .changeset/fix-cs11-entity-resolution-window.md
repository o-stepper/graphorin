---
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

fix(memory): dedup entity aliases past the candidate cap without scanning the window (CS-11)

`EntityResolver.resolve` always paged the bounded `listEntities()` candidate
window (capped at 1000 most-recent rows) and deserialized every row's embedding
BLOB — on *every* s/p/o fact write. Two problems followed: an exact alias of an
entity older than the cap fell out of the lexical scan (it only avoided minting a
duplicate because `upsertEntity` re-checks the normalized name *after* the full
scan + embed), and the offline default — no embedder, so no query vector and no
possible embedding dedup — still deserialized the whole window for nothing.

- New optional `GraphMemoryStoreExt.findEntityByNormalizedName(scope, name)` —
  an uncapped indexed lookup of the canonical root for an exact normalized name.
  `SqliteGraphStore` implements it over the existing partial-unique
  `(scope_user_id, normalized_name) WHERE merged_into IS NULL` index, so an exact
  alias of an arbitrarily-old entity resolves with one row read, no window scan.
- `resolve()` now (1) short-circuits on that exact lookup before any embedding
  call, and (2) when there is no query vector, skips the BLOB-deserializing
  `listEntities()` scan entirely and mints directly. The capped embedding scan
  now runs only on the genuinely-new-name-with-embedder path, where it is needed.

Behaviour is unchanged (same canonical id returned) — `upsertEntity` already
deduped exact names; this removes the per-write full-window deserialization and
makes the exact-alias guarantee independent of the candidate cap. Stores that
don't implement `findEntityByNormalizedName` fall through to the prior capped
lexical scan.
