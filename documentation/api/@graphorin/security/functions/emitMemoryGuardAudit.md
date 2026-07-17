[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitMemoryGuardAudit

# Function: emitMemoryGuardAudit()

```ts
function emitMemoryGuardAudit(event): void;
```

Defined in: [packages/security/src/guard/audit-emitter.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/audit-emitter.ts#L126)

Emit an event to every subscriber. Listeners that throw are
isolated - a faulty listener never tears down the guard.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`MemoryGuardAuditEvent`](/api/@graphorin/security/interfaces/MemoryGuardAuditEvent.md) |

## Returns

`void`

## Stable
