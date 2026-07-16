[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / AppliedMigration

# Interface: AppliedMigration

Defined in: [packages/store-sqlite/src/migrations/runner.ts:10](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/runner.ts#L10)

Result row of the `schema_migrations` bookkeeping table - one row per
applied migration.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-appliedat"></a> `appliedAt` | `readonly` | `number` | [packages/store-sqlite/src/migrations/runner.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/runner.ts#L13) |
| <a id="property-checksum"></a> `checksum` | `readonly` | `string` | [packages/store-sqlite/src/migrations/runner.ts:14](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/runner.ts#L14) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/store-sqlite/src/migrations/runner.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/runner.ts#L12) |
| <a id="property-version"></a> `version` | `readonly` | `string` | [packages/store-sqlite/src/migrations/runner.ts:11](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/runner.ts#L11) |
