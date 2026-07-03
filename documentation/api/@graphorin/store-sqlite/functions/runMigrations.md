[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / runMigrations

# Function: runMigrations()

```ts
function runMigrations(conn): readonly AppliedMigration[];
```

Defined in: packages/store-sqlite/src/migrations/runner.ts:25

Apply every pending migration in version order. Each migration runs
inside its own transaction so a failure mid-sequence leaves the
database in a known-good state. Re-running `runMigrations` on a
fully-migrated DB is a no-op.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

readonly [`AppliedMigration`](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)[]

## Stable
