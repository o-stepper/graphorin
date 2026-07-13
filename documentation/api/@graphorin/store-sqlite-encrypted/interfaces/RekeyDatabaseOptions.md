[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / RekeyDatabaseOptions

# Interface: RekeyDatabaseOptions

Defined in: [packages/store-sqlite-encrypted/src/rekey.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/rekey.ts#L31)

Options for [rekeyDatabase](/api/@graphorin/store-sqlite-encrypted/functions/rekeyDatabase.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | Cipher selection. Default `'sqlcipher'`. | [packages/store-sqlite-encrypted/src/rekey.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/rekey.ts#L39) |
| <a id="property-newpassphrase"></a> `newPassphrase` | `readonly` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; | New passphrase to apply. | [packages/store-sqlite-encrypted/src/rekey.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/rekey.ts#L37) |
| <a id="property-oldpassphrase"></a> `oldPassphrase` | `readonly` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; | Existing passphrase the DB is currently encrypted with. | [packages/store-sqlite-encrypted/src/rekey.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/rekey.ts#L35) |
| <a id="property-path"></a> `path` | `readonly` | `string` | Path to the encrypted DB. | [packages/store-sqlite-encrypted/src/rekey.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/rekey.ts#L33) |
