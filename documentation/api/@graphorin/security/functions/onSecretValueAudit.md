[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onSecretValueAudit

# Function: onSecretValueAudit()

```ts
function onSecretValueAudit(listener): () => void;
```

Defined in: packages/security/src/secrets/secret-value.ts:60

Subscribe to `SecretValue` lifecycle events (construct / reveal / use /
dispose). The audit-log sub-package uses this to record every unwrap
with the active actor; tests use it to assert that scoped access
patterns trigger exactly one event per call.

Returns an unsubscribe function.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `AuditListener` |

## Returns

() => `void`

## Stable
