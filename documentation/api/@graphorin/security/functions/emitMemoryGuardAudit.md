[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitMemoryGuardAudit

# Function: emitMemoryGuardAudit()

```ts
function emitMemoryGuardAudit(event): void;
```

Defined in: packages/security/src/guard/audit-emitter.ts:131

**`Stable`**

Emit an event to every subscriber. Listeners that throw are
isolated - a faulty listener never tears down the guard.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`MemoryGuardAuditEvent`](/api/@graphorin/security/interfaces/MemoryGuardAuditEvent.md) |

## Returns

`void`
