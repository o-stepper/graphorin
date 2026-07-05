[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / EncryptDatabaseOptions

# Interface: EncryptDatabaseOptions

Defined in: packages/store-sqlite-encrypted/src/encrypt.ts:40

Options for [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | Cipher selection. Default `'sqlcipher'` (SQLCipher v4 compatible). | packages/store-sqlite-encrypted/src/encrypt.ts:48 |
| <a id="property-overwritetarget"></a> `overwriteTarget?` | `readonly` | `boolean` | If `true`, overwrite an existing `targetPath` instead of failing. Default `false`. | packages/store-sqlite-encrypted/src/encrypt.ts:60 |
| <a id="property-passphrase"></a> `passphrase` | `readonly` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; | Passphrase for the new encrypted DB. | packages/store-sqlite-encrypted/src/encrypt.ts:46 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | Path to the existing unencrypted source DB. | packages/store-sqlite-encrypted/src/encrypt.ts:42 |
| <a id="property-swap"></a> `swap?` | `readonly` | `boolean` | If `true`, atomically rename `targetPath` -> `sourcePath` after the integrity check passes. The original `sourcePath` is renamed to `${sourcePath}.bak.${timestamp}` so an operator can recover. Default `false` - the CLI does the swap explicitly. | packages/store-sqlite-encrypted/src/encrypt.ts:55 |
| <a id="property-targetpath"></a> `targetPath` | `readonly` | `string` | Path the encrypted output is written to. Must not exist. | packages/store-sqlite-encrypted/src/encrypt.ts:44 |
