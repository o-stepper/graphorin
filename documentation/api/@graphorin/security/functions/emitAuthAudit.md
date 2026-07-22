[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitAuthAudit

# Function: emitAuthAudit()

```ts
function emitAuthAudit(event): void;
```

Defined in: packages/security/src/auth/audit-emitter.ts:93

**`Stable`**

Emit an auth audit event to every subscriber. Listener exceptions are
isolated from the auth path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`AuthAuditEvent`](/api/@graphorin/security/interfaces/AuthAuditEvent.md) |

## Returns

`void`
