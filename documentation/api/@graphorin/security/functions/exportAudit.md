[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / exportAudit

# Function: exportAudit()

```ts
function exportAudit(db, options): Promise<{
  rows: number;
}>;
```

Defined in: packages/security/src/audit/export.ts:53

**`Stable`**

Stream every entry in `[fromSeq, toSeq]` (inclusive) into `writer`
as JSONL. Each line is canonical JSON terminated by `\n`.

Returns the number of lines written.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `options` | [`ExportAuditOptions`](/api/@graphorin/security/interfaces/ExportAuditOptions.md) |

## Returns

`Promise`\<\{
  `rows`: `number`;
\}\>
