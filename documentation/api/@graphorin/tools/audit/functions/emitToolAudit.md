[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / emitToolAudit

# Function: emitToolAudit()

```ts
function emitToolAudit(event): void;
```

Defined in: [packages/tools/src/audit/index.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L160)

Emit an audit event. Never throws across listener boundaries -
a listener that throws is isolated so it cannot tear down the
tool execution path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`ToolAuditEvent`](/api/@graphorin/tools/audit/interfaces/ToolAuditEvent.md) |

## Returns

`void`

## Stable
