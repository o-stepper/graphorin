[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / encryptDatabase

# Function: encryptDatabase()

```ts
function encryptDatabase(options): Promise<EncryptDatabaseResult>;
```

Defined in: packages/store-sqlite-encrypted/src/encrypt.ts:84

Encrypts an unencrypted SQLite database. Returns once the target
file has been written and verified. Throws if the source is missing,
the target already exists (and `overwriteTarget` is unset), the
cipher peer is missing, or the integrity check fails.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`EncryptDatabaseOptions`](/api/@graphorin/store-sqlite-encrypted/interfaces/EncryptDatabaseOptions.md) |

## Returns

`Promise`\&lt;[`EncryptDatabaseResult`](/api/@graphorin/store-sqlite-encrypted/interfaces/EncryptDatabaseResult.md)\&gt;

## Stable
