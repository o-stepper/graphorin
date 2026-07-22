[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / onToolAudit

# Function: onToolAudit()

```ts
function onToolAudit(listener): () => void;
```

Defined in: packages/tools/src/audit/index.ts:134

**`Stable`**

Subscribe to tool-subsystem audit events. Returns a teardown
function that removes the listener; callers must invoke it on
shutdown to avoid leaks in long-running server processes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`ToolAuditListener`](/api/@graphorin/tools/audit/type-aliases/ToolAuditListener.md) |

## Returns

() => `void`
