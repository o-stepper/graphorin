[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / pendingMigrations

# Function: pendingMigrations()

```ts
function pendingMigrations(conn): readonly Migration[];
```

Defined in: packages/store-sqlite/src/migrations/runner.ts:118

**`Stable`**

The migrations bundled with this build that are NOT recorded as
applied in the supplied database. Read-only: when the
`schema_migrations` table does not exist yet (a database this code
never touched), every bundled migration is pending and the foreign
file is NOT marked by creating the table.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

readonly [`Migration`](/api/@graphorin/store-sqlite/interfaces/Migration.md)[]
