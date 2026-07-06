---
"@graphorin/store-sqlite": patch
---

The README no longer describes a WorkerPool server mode that does not exist: `CreateSqliteStoreOptions` has no `workerPool` field and there is no 1-writer/N-reader wrapper in the package. The server-mode section now documents the real difference - `mode: 'server'` auto-starts the periodic `PRAGMA wal_checkpoint(RESTART)` timer (`walCheckpointIntervalMs`, default 5 minutes) while `'lib'` starts it only when the interval is set - with a type-correct example and a link to the new per-command concurrency matrix in the storage guide.
