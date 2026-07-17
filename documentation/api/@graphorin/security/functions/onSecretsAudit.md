[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onSecretsAudit

# Function: onSecretsAudit()

```ts
function onSecretsAudit(listener): () => void;
```

Defined in: [packages/security/src/secrets/audit-emitter.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/audit-emitter.ts#L86)

Subscribe to secrets-layer audit events. The audit-log subsystem
registers exactly one listener that forwards each event into the
dedicated audit database.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `SecretsAuditListener` |

## Returns

() => `void`

## Stable
