[**Graphorin API reference v0.13.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / emitToolAudit

# Function: emitToolAudit()

```ts
function emitToolAudit(event): void;
```

Defined in: packages/tools/src/audit/index.ts:161

**`Stable`**

Emit an audit event. Never throws across listener boundaries -
a listener that throws is isolated so it cannot tear down the
tool execution path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`ToolAuditEvent`](/api/@graphorin/tools/audit/interfaces/ToolAuditEvent.md) |

## Returns

`void`
