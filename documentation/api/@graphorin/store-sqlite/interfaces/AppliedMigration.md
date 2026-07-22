[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / AppliedMigration

# Interface: AppliedMigration

Defined in: packages/store-sqlite/src/migrations/runner.ts:10

**`Stable`**

Result row of the `schema_migrations` bookkeeping table - one row per
applied migration.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-appliedat"></a> `appliedAt` | `readonly` | `number` | packages/store-sqlite/src/migrations/runner.ts:13 |
| <a id="property-checksum"></a> `checksum` | `readonly` | `string` | packages/store-sqlite/src/migrations/runner.ts:14 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/store-sqlite/src/migrations/runner.ts:12 |
| <a id="property-version"></a> `version` | `readonly` | `string` | packages/store-sqlite/src/migrations/runner.ts:11 |
