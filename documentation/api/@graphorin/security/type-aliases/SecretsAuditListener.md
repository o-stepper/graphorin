[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsAuditListener

# Type Alias: SecretsAuditListener

```ts
type SecretsAuditListener = (event) => void;
```

Defined in: packages/security/src/secrets/audit-emitter.ts:80

**`Stable`**

Callback shape accepted by [onSecretsAudit](/api/@graphorin/security/functions/onSecretsAudit.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`SecretsAuditEvent`](/api/@graphorin/security/interfaces/SecretsAuditEvent.md) |

## Returns

`void`
