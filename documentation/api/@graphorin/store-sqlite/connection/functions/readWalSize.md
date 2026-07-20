[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / readWalSize

# Function: readWalSize()

```ts
function readWalSize(conn): number;
```

Defined in: packages/store-sqlite/src/connection.ts:398

**`Stable`**

Returns the byte size of the WAL file, or `0` when the file is
absent / empty. Surfaced as `graphorin.storage.wal.size_bytes`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

`number`
