[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runAuditExport

# Function: runAuditExport()

```ts
function runAuditExport(options): Promise<AuditExportResult>;
```

Defined in: [packages/cli/src/commands/audit.ts:191](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/audit.ts#L191)

`graphorin audit export --to <file>` - stream every entry as JSONL.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`AuditExportOptions`](/api/@graphorin/cli/interfaces/AuditExportOptions.md) |

## Returns

`Promise`\&lt;[`AuditExportResult`](/api/@graphorin/cli/interfaces/AuditExportResult.md)\&gt;

## Stable
