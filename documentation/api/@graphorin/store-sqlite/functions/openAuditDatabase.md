[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / openAuditDatabase

# Function: openAuditDatabase()

```ts
function openAuditDatabase(options): Promise<AuditDatabase>;
```

Defined in: packages/store-sqlite/src/audit-db.ts:55

**`Stable`**

Opens the encrypted `audit.db` file.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OpenAuditDatabaseOptions`](/api/@graphorin/store-sqlite/interfaces/OpenAuditDatabaseOptions.md) |

## Returns

`Promise`\&lt;[`AuditDatabase`](/api/@graphorin/store-sqlite/interfaces/AuditDatabase.md)\&gt;
