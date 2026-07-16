[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / CreateSqliteStoreOptions

# Interface: CreateSqliteStoreOptions

Defined in: [packages/store-sqlite/src/index.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L145)

Options passed to [createSqliteStore](/api/@graphorin/store-sqlite/functions/createSqliteStore.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-busytimeoutms"></a> `busyTimeoutMs?` | `readonly` | `number` | W-067: busy-handler wait for a contended write lock before the operation fails with `SqliteBusyError`. Default `5000`. | [packages/store-sqlite/src/index.ts:182](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L182) |
| <a id="property-cipherloader"></a> `cipherLoader?` | `readonly` | () => `Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt; | **`Internal`** Optional cipher-driver loader override (test-only seam). See `OpenConnectionOptions.cipherLoader`. | [packages/store-sqlite/src/index.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L200) |
| <a id="property-disablewalhardening"></a> `disableWalHardening?` | `readonly` | `boolean` | If `true`, skip the WAL hardening pragmas (only for `:memory:`). | [packages/store-sqlite/src/index.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L177) |
| <a id="property-driver"></a> `driver?` | `readonly` | [`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md) | Override constructor - test-only escape hatch. | [packages/store-sqlite/src/index.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L173) |
| <a id="property-embedderpolicy"></a> `embedderPolicy?` | `readonly` | [`EmbedderPolicy`](/api/@graphorin/store-sqlite/type-aliases/EmbedderPolicy.md) | Default `'lock-on-first'` (DEC-116). | [packages/store-sqlite/src/index.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L151) |
| <a id="property-encryption"></a> `encryption?` | `readonly` | [`EncryptionConfig`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionConfig.md) | Default `{ enabled: false }`. | [packages/store-sqlite/src/index.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L153) |
| <a id="property-loadvecextension"></a> `loadVecExtension?` | `readonly` | (`db`) => `void` | Override the `sqlite-vec` loader - test-only escape hatch. | [packages/store-sqlite/src/index.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L175) |
| <a id="property-mode"></a> `mode?` | `readonly` | [`SqliteStoreMode`](/api/@graphorin/store-sqlite/type-aliases/SqliteStoreMode.md) | Default `'lib'`. | [packages/store-sqlite/src/index.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L149) |
| <a id="property-onmissingsqlitevec"></a> `onMissingSqliteVec?` | `readonly` | `"linear-fallback"` \| `"fail"` | Wave-D D5: policy when the `sqlite-vec` peer is missing/broken. `'fail'` (default) throws [SqliteVecMissingError](/api/@graphorin/store-sqlite/connection/classes/SqliteVecMissingError.md); `'linear-fallback'` serves vectors from plain sidecar tables with an in-process batched cosine scan. See `OpenConnectionOptions.onMissingSqliteVec`. | [packages/store-sqlite/src/index.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L171) |
| <a id="property-path"></a> `path` | `readonly` | `string` | SQLite path. Pass `':memory:'` for a transient in-memory database. | [packages/store-sqlite/src/index.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L147) |
| <a id="property-skipftsintegritycheck"></a> `skipFtsIntegrityCheck?` | `readonly` | `boolean` | If `true`, skip the open-time FTS integrity check (CS-10). The check is a cheap orphan-row scan; disable it only for very large stores where a per-open scan is undesirable. | [packages/store-sqlite/src/index.ts:193](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L193) |
| <a id="property-skipsqlitevec"></a> `skipSqliteVec?` | `readonly` | `boolean` | If `true`, do not load the `sqlite-vec` peer at open time. Useful for tests that exercise migrations without the native build. | [packages/store-sqlite/src/index.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L163) |
| <a id="property-walcheckpointintervalms"></a> `walCheckpointIntervalMs?` | `readonly` | `number` | Periodic checkpoint cadence. Default `300_000` (5 min) in server mode; off in library mode unless explicitly set. | [packages/store-sqlite/src/index.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L158) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Sink for non-fatal startup warnings - currently the CS-10 FTS↔rowid integrity check. Defaults to `console.warn`. | [packages/store-sqlite/src/index.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/index.ts#L187) |
