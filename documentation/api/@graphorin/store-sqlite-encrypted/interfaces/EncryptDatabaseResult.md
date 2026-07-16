[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / EncryptDatabaseResult

# Interface: EncryptDatabaseResult

Defined in: [packages/store-sqlite-encrypted/src/encrypt.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L76)

Result of a successful [encryptDatabase](/api/@graphorin/store-sqlite-encrypted/functions/encryptDatabase.md) run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher` | `readonly` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) | [packages/store-sqlite-encrypted/src/encrypt.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L79) |
| <a id="property-integritycheck"></a> `integrityCheck` | `readonly` | \{ `ok`: `boolean`; `rows`: readonly `string`[]; \} | [packages/store-sqlite-encrypted/src/encrypt.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L80) |
| `integrityCheck.ok` | `readonly` | `boolean` | [packages/store-sqlite-encrypted/src/encrypt.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L80) |
| `integrityCheck.rows` | `readonly` | readonly `string`[] | [packages/store-sqlite-encrypted/src/encrypt.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L80) |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | [packages/store-sqlite-encrypted/src/encrypt.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L77) |
| <a id="property-swap"></a> `swap?` | `readonly` | \{ `originalRenamedTo`: `string`; \} | [packages/store-sqlite-encrypted/src/encrypt.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L81) |
| `swap.originalRenamedTo` | `readonly` | `string` | [packages/store-sqlite-encrypted/src/encrypt.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L81) |
| <a id="property-targetpath"></a> `targetPath` | `readonly` | `string` | [packages/store-sqlite-encrypted/src/encrypt.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/encrypt.ts#L78) |
