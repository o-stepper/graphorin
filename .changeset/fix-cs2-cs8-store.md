---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): archived episodes excluded from FTS; atomic consolidator lock (CS-2, CS-8)

- **CS-2**: episodic FTS `search` lacked the `archived = 0` predicate the
  episodic vector leg and `archive()`'s TSDoc both enforce — hybrid recall
  was internally inconsistent (the FTS leg saw archived episodes, the
  vector leg did not). The predicate is added; the test now asserts an
  archived episode is absent from search results.
- **CS-8**: `acquireLock` was a read-then-write (`getState` then
  `upsertState`) with an `await` point between — two runners (in-process
  microtasks, or the documented server + CLI on one WAL database) could
  both acquire one scope's lock. It is now a single conditional UPSERT
  (`... WHERE lock IS NULL OR lock = me OR acquired_at < stale`) gated on
  `changes === 1`; better-sqlite3's synchronous execution closes the
  window. Test: exactly one of 20 concurrent acquisitions wins.
