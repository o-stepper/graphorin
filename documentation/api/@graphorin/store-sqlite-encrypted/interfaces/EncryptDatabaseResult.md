[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / EncryptDatabaseResult

# Interface: EncryptDatabaseResult

Defined in: packages/store-sqlite-encrypted/src/encrypt.ts:68

Result of a successful [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | packages/store-sqlite-encrypted/src/encrypt.ts:71 |
| <a id="property-integritycheck"></a> `integrityCheck` | `readonly` | \{ `ok`: `boolean`; `rows`: readonly `string`[]; \} | packages/store-sqlite-encrypted/src/encrypt.ts:72 |
| `integrityCheck.ok` | `readonly` | `boolean` | packages/store-sqlite-encrypted/src/encrypt.ts:72 |
| `integrityCheck.rows` | `readonly` | readonly `string`[] | packages/store-sqlite-encrypted/src/encrypt.ts:72 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:69 |
| <a id="property-swap"></a> `swap?` | `readonly` | \{ `originalRenamedTo`: `string`; \} | packages/store-sqlite-encrypted/src/encrypt.ts:73 |
| `swap.originalRenamedTo` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:73 |
| <a id="property-targetpath"></a> `targetPath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:70 |
