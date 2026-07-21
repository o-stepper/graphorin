[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onSecretsAudit

# Function: onSecretsAudit()

```ts
function onSecretsAudit(listener): () => void;
```

Defined in: packages/security/src/secrets/audit-emitter.ts:91

**`Stable`**

Subscribe to secrets-layer audit events. The audit-log subsystem
registers exactly one listener that forwards each event into the
dedicated audit database.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`SecretsAuditListener`](/api/@graphorin/security/type-aliases/SecretsAuditListener.md) |

## Returns

() => `void`
