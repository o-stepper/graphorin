[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / deleteSpansForSession

# Function: deleteSpansForSession()

```ts
function deleteSpansForSession(conn, sessionId): number;
```

Defined in: packages/store-sqlite/src/span-store.ts:120

**`Stable`**

Delete every persisted span of one session. Called by the
session hard-delete cascade (the `spans` entry of
`SESSION_SCOPED_PURGES`); exported for hosts that manage spans out
of band. Returns the number of rows deleted.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `sessionId` | `string` |

## Returns

`number`
