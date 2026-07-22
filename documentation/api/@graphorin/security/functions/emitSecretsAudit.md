[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / emitSecretsAudit

# Function: emitSecretsAudit()

```ts
function emitSecretsAudit(event): void;
```

Defined in: packages/security/src/secrets/audit-emitter.ts:115

**`Stable`**

Emit an event to every subscriber. Listeners that throw are
isolated - a faulty listener never tears down the secret access
path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`SecretsAuditEvent`](/api/@graphorin/security/interfaces/SecretsAuditEvent.md) |

## Returns

`void`
