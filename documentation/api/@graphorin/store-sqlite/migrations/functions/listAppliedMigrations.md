[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [migrations](/api/@graphorin/store-sqlite/migrations/index.md) / listAppliedMigrations

# Function: listAppliedMigrations()

```ts
function listAppliedMigrations(conn): readonly AppliedMigration[];
```

Defined in: packages/store-sqlite/src/migrations/runner.ts:132

**`Stable`**

Snapshot of every migration ever applied to this database.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[]
