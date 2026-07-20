[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / EncryptDatabaseOptions

# Interface: EncryptDatabaseOptions

Defined in: packages/store-sqlite-encrypted/src/encrypt.ts:40

**`Stable`**

Options for [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | Cipher selection. Default `'sqlcipher'` (SQLCipher v4 compatible). | packages/store-sqlite-encrypted/src/encrypt.ts:48 |
| <a id="property-overwritetarget"></a> `overwriteTarget?` | `readonly` | `boolean` | If `true`, overwrite an existing `targetPath` instead of failing. Default `false`. | packages/store-sqlite-encrypted/src/encrypt.ts:68 |
| <a id="property-passphrase"></a> `passphrase` | `readonly` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; | Passphrase for the new encrypted DB. | packages/store-sqlite-encrypted/src/encrypt.ts:46 |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | Path to the existing unencrypted source DB. | packages/store-sqlite-encrypted/src/encrypt.ts:42 |
| <a id="property-swap"></a> `swap?` | `readonly` | `boolean` | If `true`, atomically rename `targetPath` -> `sourcePath` after the integrity check passes. The original `sourcePath` is renamed to `${sourcePath}.bak.${timestamp}` so an operator can recover. Default `false` - the CLI does the swap explicitly. REQUIRES A STOPPED SERVER: a live writer keeps its file descriptor on the renamed `.bak` inode and every post-snapshot commit silently diverges from the new encrypted file (and is later deleted by `storage cleanup-backups`). A best-effort live-writer probe refuses the swap with [EncryptSwapLiveWriterError](/api/@graphorin/store-sqlite-encrypted/classes/EncryptSwapLiveWriterError.md) when another connection holds the database; the probe-to-rename window remains a documented residual race. | packages/store-sqlite-encrypted/src/encrypt.ts:63 |
| <a id="property-targetpath"></a> `targetPath` | `readonly` | `string` | Path the encrypted output is written to. Must not exist. | packages/store-sqlite-encrypted/src/encrypt.ts:44 |
