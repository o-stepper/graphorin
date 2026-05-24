[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / CipherIntegrityCheckResult

# Interface: CipherIntegrityCheckResult

Defined in: packages/store-sqlite-encrypted/src/integrity-check.ts:16

Result of [cipherIntegrityCheck](/api/@graphorin/store-sqlite-encrypted/functions/cipherIntegrityCheck.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock duration of the pragma call in milliseconds. | packages/store-sqlite-encrypted/src/integrity-check.ts:22 |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | `true` when SQLite reported a single `'ok'` row. | packages/store-sqlite-encrypted/src/integrity-check.ts:18 |
| <a id="property-rows"></a> `rows` | `readonly` | readonly `string`[] | Raw rows returned by `PRAGMA cipher_integrity_check`. | packages/store-sqlite-encrypted/src/integrity-check.ts:20 |
