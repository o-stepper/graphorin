[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onAuthAudit

# Function: onAuthAudit()

```ts
function onAuthAudit(listener): () => void;
```

Defined in: packages/security/src/auth/audit-emitter.ts:66

**`Stable`**

Subscribe to auth audit events. Returns an unsubscribe function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`AuthAuditListener`](/api/@graphorin/security/type-aliases/AuthAuditListener.md) |

## Returns

() => `void`
