[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onMemoryGuardAudit

# Function: onMemoryGuardAudit()

```ts
function onMemoryGuardAudit(listener): () => void;
```

Defined in: packages/security/src/guard/audit-emitter.ts:100

**`Stable`**

Subscribe to guard audit events. Returns an unsubscribe function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`MemoryGuardAuditListener`](/api/@graphorin/security/type-aliases/MemoryGuardAuditListener.md) |

## Returns

() => `void`
