---
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/workflow': patch
---

W-009: checkpoint GC primitives - `CheckpointStoreExt` with `pruneThreads` and `compactThread`.

The engine writes a full state snapshot per superstep and nothing ever deleted them (`deleteThread` had zero production callers). `@graphorin/core` adds the additive `CheckpointStoreExt` contract: `pruneThreads({beforeEpochMs, onlyTerminal})` - a namespace-SCOPED retention sweep whose policy reads each pair's LATEST checkpoint (suspended threads with live HITL approvals/awakeables survive by default) - and `compactThread(threadId, namespace, keepLast)` for in-place history compaction (resume reads the latest tuple, so `keepLast >= 1` never breaks resumability). Implemented by `SqliteCheckpointStore` (per-pair transactions, never via the namespace-blind `deleteThread` - a reused threadId across workflows must not lose another workflow's suspended state) and by `InMemoryCheckpointStore`. `GraphorinSqliteStore.checkpoints` is now typed `CheckpointStoreExt`. `documentation/guide/workflow-engine.md` gains a "Retention and cleanup" section with the growth arithmetic and the deleteThread caveat.
