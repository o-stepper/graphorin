[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / onToolAudit

# Function: onToolAudit()

```ts
function onToolAudit(listener): () => void;
```

Defined in: [packages/tools/src/audit/index.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L129)

Subscribe to tool-subsystem audit events. Returns a teardown
function that removes the listener; callers must invoke it on
shutdown to avoid leaks in long-running server processes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `Listener` |

## Returns

() => `void`

## Stable
