[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / RunMigrationsOptions

# Interface: RunMigrationsOptions

Defined in: packages/store-sqlite/src/migrations/runner.ts:23

**`Internal`**

Tuning knobs for [runMigrations](/api/@graphorin/store-sqlite/functions/runMigrations.md). Only `upTo` exists so
far and it is test-only.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-upto"></a> `upTo?` | `readonly` | `string` | **`Internal`** Stop after this version (inclusive) - later migrations stay pending. Test-only: lets a suite build a database frozen at a historical schema and then exercise the upgrade path across a specific migration. Not for production use; a partially-migrated database is not a supported runtime state. | packages/store-sqlite/src/migrations/runner.ts:33 |
