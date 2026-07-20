[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / createEncryptedConnection

# Function: createEncryptedConnection()

```ts
function createEncryptedConnection(options): Promise<SqliteConnection>;
```

Defined in: packages/store-sqlite-encrypted/src/connection.ts:35

**`Stable`**

Opens an encrypted SQLite connection. Differs from `openConnection`
only in that the cipher peer driver is preloaded - callers that
supply an `encryption.passphraseResolver` get the same behaviour as
`openConnection({ encryption })` plus an explicit fail-fast on a
missing cipher peer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OpenConnectionOptions`](/api/@graphorin/store-sqlite/connection/interfaces/OpenConnectionOptions.md) |

## Returns

`Promise`\&lt;[`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md)\&gt;
