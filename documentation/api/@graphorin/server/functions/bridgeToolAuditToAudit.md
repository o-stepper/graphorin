[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / bridgeToolAuditToAudit

# Function: bridgeToolAuditToAudit()

```ts
function bridgeToolAuditToAudit(db, options?): ToolAuditBridge;
```

Defined in: packages/server/src/tools-audit-bridge.ts:88

Subscribe the audit chain to the tools audit bus. Returns a handle
whose `stop()` MUST run on shutdown (the bus is process-global).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `options` | \{ `onWriteError?`: (`event`, `error`) => `void`; `policy?`: [`ToolEventsAuditPolicy`](/api/@graphorin/server/type-aliases/ToolEventsAuditPolicy.md); \} |
| `options.onWriteError?` | (`event`, `error`) => `void` |
| `options.policy?` | [`ToolEventsAuditPolicy`](/api/@graphorin/server/type-aliases/ToolEventsAuditPolicy.md) |

## Returns

[`ToolAuditBridge`](/api/@graphorin/server/interfaces/ToolAuditBridge.md)

## Stable
