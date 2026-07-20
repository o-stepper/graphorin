[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / OpenConnectionOptions

# Interface: OpenConnectionOptions

Defined in: packages/store-sqlite/src/connection.ts:79

**`Stable`**

Options for [openConnection](/api/@graphorin/store-sqlite/connection/functions/openConnection.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-busytimeoutms"></a> `busyTimeoutMs?` | `readonly` | `number` | How long the driver's busy handler waits for a contended write lock before the operation fails with [SqliteBusyError](/api/@graphorin/store-sqlite/connection/classes/SqliteBusyError.md). Applied AFTER the hardening pragmas so the exported [WAL\_HARDENING\_PRAGMAS](/api/@graphorin/store-sqlite/connection/variables/WAL_HARDENING_PRAGMAS.md) constant keeps its documented bytes; also honoured on the `disableWalHardening` / `:memory:` branch. **Default** `5000` | packages/store-sqlite/src/connection.ts:138 |
| <a id="property-cipherloader"></a> `cipherLoader?` | `readonly` | () => `Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt; | **`Internal`** Optional cipher-driver loader override. When `encryption.enabled` is `true` and the operator does not pass `driver`, this loader is consulted instead of the canonical `loadCipherDriver`. Used by the test suite to simulate a missing cipher peer without uninstalling the package from the workspace. | packages/store-sqlite/src/connection.ts:129 |
| <a id="property-disablewalhardening"></a> `disableWalHardening?` | `readonly` | `boolean` | If `true`, do not apply the WAL hardening pragmas. The runner still applies `foreign_keys=ON` and `busy_timeout` so the migration step works against `:memory:` databases. Off by default. | packages/store-sqlite/src/connection.ts:118 |
| <a id="property-driver"></a> `driver?` | `readonly` | [`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md) | Override the constructor used to open the underlying database. Used by the test suite to inject a stub. When unset the connection lazily loads `better-sqlite3` (or the cipher peer when encryption is enabled) at first call. | packages/store-sqlite/src/connection.ts:107 |
| <a id="property-encryption"></a> `encryption?` | `readonly` | [`EncryptionConfig`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionConfig.md) | Optional encryption-at-rest configuration. Default: disabled. | packages/store-sqlite/src/connection.ts:82 |
| <a id="property-loadvecextension"></a> `loadVecExtension?` | `readonly` | (`db`) => `void` | Override the `sqlite-vec` `load(db)` helper. Used by the test suite to verify the loader is invoked without a native build. | packages/store-sqlite/src/connection.ts:112 |
| <a id="property-onmissingsqlitevec"></a> `onMissingSqliteVec?` | `readonly` | `"linear-fallback"` \| `"fail"` | Policy when the `sqlite-vec` peer is missing or fails to load. `'fail'` (default) rethrows [SqliteVecMissingError](/api/@graphorin/store-sqlite/connection/classes/SqliteVecMissingError.md) - the historical behaviour. `'linear-fallback'` degrades instead of dying: vector sidecars are kept in PLAIN tables (same names/columns) and KNN runs as an in-process batched cosine scan with `setImmediate` yields. Suits environments where the native build is unavailable and degraded vector recall beats a crash. A database must stay in ONE mode: the table manager refuses to open vec0 tables in fallback mode (and plain fallback tables in vec0 mode) with an actionable error. | packages/store-sqlite/src/connection.ts:100 |
| <a id="property-path"></a> `path` | `readonly` | `string` | - | packages/store-sqlite/src/connection.ts:80 |
| <a id="property-skipsqlitevec"></a> `skipSqliteVec?` | `readonly` | `boolean` | If `true`, skip loading the `sqlite-vec` extension. Used by tests that exercise the migration runner without the vector adapter. | packages/store-sqlite/src/connection.ts:87 |
