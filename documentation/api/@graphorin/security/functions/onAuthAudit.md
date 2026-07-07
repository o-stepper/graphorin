[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onAuthAudit

# Function: onAuthAudit()

```ts
function onAuthAudit(listener): () => void;
```

Defined in: [packages/security/src/auth/audit-emitter.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/audit-emitter.ts#L66)

Subscribe to auth audit events. Returns an unsubscribe function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`AuthAuditListener`](/api/@graphorin/security/type-aliases/AuthAuditListener.md) |

## Returns

() => `void`

## Stable
