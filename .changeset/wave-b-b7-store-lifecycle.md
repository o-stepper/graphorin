---
'@graphorin/store-sqlite': patch
'@graphorin/store-sqlite-encrypted': patch
'@graphorin/cli': patch
---

Store durability and data lifecycle (audit 2026-07-04 Wave B, cluster B7).

- store-02: new `graphorin storage backup <dest>` - online, consistent copy via the driver's page-level `backup()` API (safe under a live writer, preserves rowids so FTS5 mappings survive, encrypted stores produce an equally-encrypted copy). `deployment.md` stops recommending the non-existent `BACKUP TO` and explicitly warns against `VACUUM INTO`.
- store-03: episode vector KNN gains the MRET-9 over-fetch loop facts already had (shared `widenKnn` helper) - a minority user's episodic recall is no longer starved to zero by a dominant user's vectors.
- store-04: GDPR `purge()` scrubs the fact's text out of `memory_history` (both rows keyed to the id and value-matching rows - a SUPERSEDE row carries the new fact's text on the OLD id) inside the same transaction, keeping the event skeleton; new `SqliteMemoryStore.pruneHistory(olderThanMs)` retention API bounds the otherwise-unbounded table.
- store-05: `encryptDatabase` copies via the driver's online backup API instead of checkpoint-close-then-copyFileSync - a concurrent writer can no longer commit WAL frames that silently miss the encrypted copy.
- store-06: every write transaction now BEGINs IMMEDIATE, eliminating the SQLITE_BUSY_SNAPSHOT class on read-then-write transactions under server+CLI concurrency (busy_timeout waits instead).
- store-07: `upsertState` builds its UPDATE from the supplied patch keys only (insert-if-absent + patch, in one immediate transaction) and `releaseLock` is a single conditional UPDATE - a concurrently acquired consolidator lock can no longer be silently reverted.
- store-13: migration 025 adds partial indexes on `facts.supersedes` / `facts.superseded_by`, so `historyOf` chain walks stop scanning the user's facts per node; registry owner map backfilled for 024/025.
- store F13: `distanceMetric: 'dot'` is coerced to `'cosine'` at registration with a loud warning (the vec0 table never computed dot; the meta now matches reality).
