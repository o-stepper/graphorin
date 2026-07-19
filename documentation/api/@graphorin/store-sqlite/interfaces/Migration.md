[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / Migration

# Interface: Migration

Defined in: packages/store-sqlite/src/migrations/registry.ts:20

**`Stable`**

Single source of truth for the bundled migration SQL files. The runner
loads them in numeric order, applies them inside a single transaction,
and records the applied version in `schema_migrations`.

Bundled migrations live alongside this file (`*.sql`) and are read at
package load time. The file name format is mandatory:
`NNN-<slug>.sql`, where `NNN` is a zero-padded sequence number.

Future packages register additional migrations by appending entries
to [registerMigration](/api/@graphorin/store-sqlite/functions/registerMigration.md) during their package initialization.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | Human-readable slug, e.g. `'memory'`. | packages/store-sqlite/src/migrations/registry.ts:24 |
| <a id="property-owner"></a> `owner` | `readonly` | `string` | Owning module - surfaced in error messages. | packages/store-sqlite/src/migrations/registry.ts:28 |
| <a id="property-preflight"></a> `preflight?` | `readonly` | (`conn`) => `void` | Optional data-repair hook. The runner invokes it INSIDE the migration's transaction, immediately BEFORE `sql`, and only when the migration is actually pending. It exists so a migration whose DDL cannot tolerate pre-existing bad data (e.g. a CREATE UNIQUE INDEX over rows that already contain duplicates) can repair that data first WITHOUT editing the SQL file - the file stays byte-identical, so the checksum tamper-guard keeps holding for databases that already applied the version. | packages/store-sqlite/src/migrations/registry.ts:39 |
| <a id="property-sql"></a> `sql` | `readonly` | `string` | Raw SQL body (multi-statement). | packages/store-sqlite/src/migrations/registry.ts:26 |
| <a id="property-version"></a> `version` | `readonly` | `string` | Zero-padded sequence number - must be globally unique. | packages/store-sqlite/src/migrations/registry.ts:22 |
