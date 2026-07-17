[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / toolAuditEventToAuditInput

# Function: toolAuditEventToAuditInput()

```ts
function toolAuditEventToAuditInput(event): AuditEntryInput;
```

Defined in: [packages/server/src/tools-audit-bridge.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/tools-audit-bridge.ts#L57)

Translate a tools audit event into an audit-chain entry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`ToolAuditEvent`](/api/@graphorin/tools/audit/interfaces/ToolAuditEvent.md) |

## Returns

[`AuditEntryInput`](/api/@graphorin/security/interfaces/AuditEntryInput.md)
