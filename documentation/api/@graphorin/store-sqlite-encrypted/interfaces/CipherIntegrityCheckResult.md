[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / CipherIntegrityCheckResult

# Interface: CipherIntegrityCheckResult

Defined in: packages/store-sqlite-encrypted/src/integrity-check.ts:20

**`Stable`**

Result of [cipherIntegrityCheck](/api/@graphorin/store-sqlite-encrypted/functions/cipherIntegrityCheck.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock duration of the pragma call in milliseconds. | packages/store-sqlite-encrypted/src/integrity-check.ts:26 |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | `true` when SQLite reported a single `'ok'` row. | packages/store-sqlite-encrypted/src/integrity-check.ts:22 |
| <a id="property-rows"></a> `rows` | `readonly` | readonly `string`[] | Raw rows returned by `PRAGMA integrity_check`. | packages/store-sqlite-encrypted/src/integrity-check.ts:24 |
