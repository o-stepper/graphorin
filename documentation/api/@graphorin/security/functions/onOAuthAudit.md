[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onOAuthAudit

# Function: onOAuthAudit()

```ts
function onOAuthAudit(listener): () => void;
```

Defined in: packages/security/src/oauth/audit-emitter.ts:72

Subscribe to OAuth-subsystem audit events. The audit-log subsystem
registers exactly one listener that forwards each event to the
audit database.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `OAuthAuditListener` |

## Returns

() => `void`

## Stable
