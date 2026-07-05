[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / Migration

# Interface: Migration

Defined in: packages/store-sqlite/src/migrations/registry.ts:19

Single source of truth for the bundled migration SQL files. The runner
loads them in numeric order, applies them inside a single transaction,
and records the applied version in `schema_migrations`.

Bundled migrations live alongside this file (`*.sql`) and are read at
package load time. The file name format is mandatory:
`NNN-<slug>.sql`, where `NNN` is a zero-padded sequence number.

Future packages register additional migrations by appending entries
to [registerMigration](/api/@graphorin/store-sqlite/functions/registerMigration.md) during their package initialization.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | Human-readable slug, e.g. `'memory'`. | packages/store-sqlite/src/migrations/registry.ts:23 |
| <a id="property-owner"></a> `owner` | `readonly` | `string` | Owning module - surfaced in error messages. | packages/store-sqlite/src/migrations/registry.ts:27 |
| <a id="property-sql"></a> `sql` | `readonly` | `string` | Raw SQL body (multi-statement). | packages/store-sqlite/src/migrations/registry.ts:25 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Zero-padded sequence number - must be globally unique. | packages/store-sqlite/src/migrations/registry.ts:21 |
