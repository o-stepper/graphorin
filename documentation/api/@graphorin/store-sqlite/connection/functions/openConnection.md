[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / openConnection

# Function: openConnection()

```ts
function openConnection(options): Promise<SqliteConnection>;
```

Defined in: [packages/store-sqlite/src/connection.ts:182](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L182)

Opens a connection. Side effects (in this order):
  1. Resolve the encryption passphrase if `encryption.enabled === true`.
  2. Load the cipher driver or the default `better-sqlite3` peer.
  3. Create the parent directory if absent (`recursive: true`).
  4. Open the database file.
  5. Apply WAL hardening pragmas.
  6. Apply the cipher passphrase (`PRAGMA key = ...`).
  7. Load `sqlite-vec` (unless `skipSqliteVec` is set).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OpenConnectionOptions`](/api/@graphorin/store-sqlite/connection/interfaces/OpenConnectionOptions.md) |

## Returns

`Promise`\&lt;[`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md)\&gt;

## Stable
