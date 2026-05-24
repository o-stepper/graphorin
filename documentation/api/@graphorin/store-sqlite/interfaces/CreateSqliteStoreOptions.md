[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / CreateSqliteStoreOptions

# Interface: CreateSqliteStoreOptions

Defined in: packages/store-sqlite/src/index.ts:113

Options passed to [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipherloader"></a> `cipherLoader?` | `readonly` | () => `Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt; | **`Internal`** Optional cipher-driver loader override (test-only seam). See import('./connection.js').OpenConnectionOptions.cipherLoader. | packages/store-sqlite/src/index.ts:144 |
| <a id="property-disablewalhardening"></a> `disableWalHardening?` | `readonly` | `boolean` | If `true`, skip the WAL hardening pragmas (only for `:memory:`). | packages/store-sqlite/src/index.ts:137 |
| <a id="property-driver"></a> `driver?` | `readonly` | [`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md) | Override constructor — test-only escape hatch. | packages/store-sqlite/src/index.ts:133 |
| <a id="property-embedderpolicy"></a> `embedderPolicy?` | `readonly` | [`EmbedderPolicy`](/api/@graphorin/store-sqlite/type-aliases/EmbedderPolicy.md) | Default `'lock-on-first'` (DEC-116). | packages/store-sqlite/src/index.ts:119 |
| <a id="property-encryption"></a> `encryption?` | `readonly` | [`EncryptionConfig`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionConfig.md) | Default `{ enabled: false }`. | packages/store-sqlite/src/index.ts:121 |
| <a id="property-loadvecextension"></a> `loadVecExtension?` | `readonly` | (`db`) => `void` | Override the `sqlite-vec` loader — test-only escape hatch. | packages/store-sqlite/src/index.ts:135 |
| <a id="property-mode"></a> `mode?` | `readonly` | [`SqliteStoreMode`](/api/@graphorin/store-sqlite/type-aliases/SqliteStoreMode.md) | Default `'lib'`. | packages/store-sqlite/src/index.ts:117 |
| <a id="property-path"></a> `path` | `readonly` | `string` | SQLite path. Pass `':memory:'` for a transient in-memory database. | packages/store-sqlite/src/index.ts:115 |
| <a id="property-skipsqlitevec"></a> `skipSqliteVec?` | `readonly` | `boolean` | If `true`, do not load the `sqlite-vec` peer at open time. Useful for tests that exercise migrations without the native build. | packages/store-sqlite/src/index.ts:131 |
| <a id="property-walcheckpointintervalms"></a> `walCheckpointIntervalMs?` | `readonly` | `number` | Periodic checkpoint cadence. Default `300_000` (5 min) in server mode; off in library mode unless explicitly set. | packages/store-sqlite/src/index.ts:126 |
