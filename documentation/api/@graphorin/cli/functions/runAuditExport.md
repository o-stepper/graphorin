[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runAuditExport

# Function: runAuditExport()

```ts
function runAuditExport(options): Promise<AuditExportResult>;
```

Defined in: packages/cli/src/commands/audit.ts:191

**`Stable`**

`graphorin audit export --to <file>` - stream every entry as JSONL.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuditExportOptions`](/api/@graphorin/cli/interfaces/AuditExportOptions.md) |

## Returns

`Promise`\&lt;[`AuditExportResult`](/api/@graphorin/cli/interfaces/AuditExportResult.md)\&gt;
