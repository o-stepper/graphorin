[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / EncryptDatabaseResult

# Interface: EncryptDatabaseResult

Defined in: packages/store-sqlite-encrypted/src/encrypt.ts:76

**`Stable`**

Result of a successful [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) run.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | packages/store-sqlite-encrypted/src/encrypt.ts:79 |
| <a id="property-integritycheck"></a> `integrityCheck` | `readonly` | \{ `ok`: `boolean`; `rows`: readonly `string`[]; \} | packages/store-sqlite-encrypted/src/encrypt.ts:80 |
| `integrityCheck.ok` | `readonly` | `boolean` | packages/store-sqlite-encrypted/src/encrypt.ts:80 |
| `integrityCheck.rows` | `readonly` | readonly `string`[] | packages/store-sqlite-encrypted/src/encrypt.ts:80 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:77 |
| <a id="property-swap"></a> `swap?` | `readonly` | \{ `originalRenamedTo`: `string`; \} | packages/store-sqlite-encrypted/src/encrypt.ts:81 |
| `swap.originalRenamedTo` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:81 |
| <a id="property-targetpath"></a> `targetPath` | `readonly` | `string` | packages/store-sqlite-encrypted/src/encrypt.ts:78 |
