[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / RekeyDatabaseResult

# Interface: RekeyDatabaseResult

Defined in: packages/store-sqlite-encrypted/src/rekey.ts:47

**`Stable`**

Result of a successful [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md) run.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | packages/store-sqlite-encrypted/src/rekey.ts:49 |
| <a id="property-integritycheck"></a> `integrityCheck` | `readonly` | \{ `ok`: `boolean`; `rows`: readonly `string`[]; \} | packages/store-sqlite-encrypted/src/rekey.ts:50 |
| `integrityCheck.ok` | `readonly` | `boolean` | packages/store-sqlite-encrypted/src/rekey.ts:50 |
| `integrityCheck.rows` | `readonly` | readonly `string`[] | packages/store-sqlite-encrypted/src/rekey.ts:50 |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/store-sqlite-encrypted/src/rekey.ts:48 |
