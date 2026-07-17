[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / connection

# connection

## Classes

| Class | Description |
| ------ | ------ |
| [SqliteBusyError](/api/@graphorin/store-sqlite/connection/classes/SqliteBusyError.md) | Typed wrapper for the driver's raw `SQLITE_BUSY` / `SQLITE_BUSY_SNAPSHOT` errors (W-067): the write lock stayed contended past `busy_timeout`. Carries `code = 'SQLITE_BUSY'` for compatibility with callers that already branch on the driver's `err.code`, plus the driver error as `cause`. No auto-retry by design (deterministic policies; the busy handler already waited the full `busy_timeout`). |
| [SqliteVecMissingError](/api/@graphorin/store-sqlite/connection/classes/SqliteVecMissingError.md) | - |
| [WalCheckpointManager](/api/@graphorin/store-sqlite/connection/classes/WalCheckpointManager.md) | Periodic `wal_checkpoint(RESTART)` runner. Invoked by the worker pool every `intervalMs` to bound WAL growth on long-running servers. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [BetterSqlite3Database](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Database.md) | Subset of the `better-sqlite3` `Database` surface used by the store. Declared structurally so the package can defer the peer dependency load to runtime and keep the module load free of side effects. |
| [BetterSqlite3Statement](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Statement.md) | Subset of the `better-sqlite3` prepared-statement surface used by the store. |
| [OpenConnectionOptions](/api/@graphorin/store-sqlite/connection/interfaces/OpenConnectionOptions.md) | Options for [openConnection](/api/@graphorin/store-sqlite/connection/functions/openConnection.md). |
| [SqliteConnection](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) | The runtime contract every higher-level store interacts with. The concrete adapter is built by [openConnection](/api/@graphorin/store-sqlite/connection/functions/openConnection.md) and wraps either `better-sqlite3` (default) or `better-sqlite3-multiple-ciphers` (encryption-at-rest opt-in). |

## Variables

| Variable | Description |
| ------ | ------ |
| [WAL\_HARDENING\_PRAGMAS](/api/@graphorin/store-sqlite/connection/variables/WAL_HARDENING_PRAGMAS.md) | Mandatory WAL hardening pragmas applied at connection open. Any deviation must be documented in the calling site's TSDoc per the Phase 05 acceptance criteria. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetDriverCacheForTesting](/api/@graphorin/store-sqlite/connection/functions/resetDriverCacheForTesting.md) | Test-only helper. Drops cached driver / loader handles so the next `openConnection(...)` call resolves them again. |
| [openConnection](/api/@graphorin/store-sqlite/connection/functions/openConnection.md) | Opens a connection. Side effects (in this order): 1. Resolve the encryption passphrase if `encryption.enabled === true`. 2. Load the cipher driver or the default `better-sqlite3` peer. 3. Create the parent directory if absent (`recursive: true`). 4. Open the database file. 5. Apply WAL hardening pragmas. 6. Apply the cipher passphrase (`PRAGMA key = ...`). 7. Load `sqlite-vec` (unless `skipSqliteVec` is set). |
| [readPragma](/api/@graphorin/store-sqlite/connection/functions/readPragma.md) | Pragma helper that surfaces the runtime value of a single setting as a typed scalar. Used by the integration tests to verify the WAL hardening defaults landed correctly. |
| [readWalSize](/api/@graphorin/store-sqlite/connection/functions/readWalSize.md) | Returns the byte size of the WAL file, or `0` when the file is absent / empty. Surfaced as `graphorin.storage.wal.size_bytes`. |

## References

### BetterSqlite3Constructor

Re-exports [BetterSqlite3Constructor](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)
