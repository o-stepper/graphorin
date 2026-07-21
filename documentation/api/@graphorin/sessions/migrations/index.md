[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / migrations

# migrations

Migration registry for the JSONL session-export schema. v0.1 ships
MAJOR `1` only; the registry exists so future MAJOR bumps can plug
a migrator in without forking this package.

Each migrator is a pure function that takes the parsed records of a
MAJOR `N` file and returns the parsed records as MAJOR `N+1`. The
runtime CLI (`graphorin migrate-export <input> --to-schema 2.0`)
walks the chain.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ExportMigrator](/api/@graphorin/sessions/migrations/interfaces/ExportMigrator.md) | Migrator entry. Both sides of the version pair are `'MAJOR.MINOR'` strings. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetExportMigratorsForTesting](/api/@graphorin/sessions/migrations/functions/resetExportMigratorsForTesting.md) | Reset the registry. Test-only. |
| [listExportMigrators](/api/@graphorin/sessions/migrations/functions/listExportMigrators.md) | Snapshot of the registry. Sorted by `fromVersion`. |
| [migrateExport](/api/@graphorin/sessions/migrations/functions/migrateExport.md) | Walk the registered migrators to advance `records` from `fromVersion` to `toVersion`. Throws when no chain exists. |
| [registerExportMigrator](/api/@graphorin/sessions/migrations/functions/registerExportMigrator.md) | Register a migrator. Idempotent on the `(fromVersion, toVersion)` pair - re-registering replaces the prior entry. |
