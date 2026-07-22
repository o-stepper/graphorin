[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / AuditDatabase

# Interface: AuditDatabase

Defined in: packages/store-sqlite/src/audit-db.ts:44

**`Stable`**

Lightweight handle returned by [openAuditDatabase](/api/@graphorin/store-sqlite/functions/openAuditDatabase.md). The audit
package (Phase 03) owns the schema; this module only opens the file
with the cipher peer and applies WAL hardening so the consumer can
focus on appending audit records.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-db"></a> `db` | `readonly` | [`BetterSqlite3Database`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Database.md) | packages/store-sqlite/src/audit-db.ts:46 |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/store-sqlite/src/audit-db.ts:45 |

## Methods

### close()

```ts
close(): void;
```

Defined in: packages/store-sqlite/src/audit-db.ts:47

#### Returns

`void`
