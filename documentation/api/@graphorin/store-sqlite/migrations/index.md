[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / migrations

# migrations

Migration registry + runner for `@graphorin/store-sqlite`.

The default `createSqliteStore({ ... })` factory invokes
[runMigrations](/api/@graphorin/store-sqlite/functions/runMigrations.md) during `MemoryStore.init`; downstream
packages register additional migrations via [registerMigration](/api/@graphorin/store-sqlite/functions/registerMigration.md)
before the first `init()` call.

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetDynamicMigrationsForTesting](/api/@graphorin/store-sqlite/migrations/functions/resetDynamicMigrationsForTesting.md) | Test-only helper. Drops every dynamically-registered migration so a test can rebuild a clean registry without leaking state across cases. |
| [listAppliedMigrations](/api/@graphorin/store-sqlite/migrations/functions/listAppliedMigrations.md) | Snapshot of every migration ever applied to this database. |

## References

### AppliedMigration

Re-exports [AppliedMigration](/api/@graphorin/store-sqlite/interfaces/AppliedMigration.md)

***

### listMigrations

Re-exports [listMigrations](/api/@graphorin/store-sqlite/functions/listMigrations.md)

***

### Migration

Re-exports [Migration](/api/@graphorin/store-sqlite/interfaces/Migration.md)

***

### pendingMigrations

Re-exports [pendingMigrations](/api/@graphorin/store-sqlite/functions/pendingMigrations.md)

***

### registerMigration

Re-exports [registerMigration](/api/@graphorin/store-sqlite/functions/registerMigration.md)

***

### runMigrations

Re-exports [runMigrations](/api/@graphorin/store-sqlite/functions/runMigrations.md)

***

### RunMigrationsOptions

Re-exports [RunMigrationsOptions](/api/@graphorin/store-sqlite/interfaces/RunMigrationsOptions.md)
