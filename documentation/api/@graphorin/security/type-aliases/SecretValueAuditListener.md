[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretValueAuditListener

# Type Alias: SecretValueAuditListener

```ts
type SecretValueAuditListener = (event) => void;
```

Defined in: packages/security/src/secrets/secret-value.ts:51

**`Stable`**

Callback shape accepted by [onSecretValueAudit](/api/@graphorin/security/functions/onSecretValueAudit.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`SecretValueAuditEvent`](/api/@graphorin/security/type-aliases/SecretValueAuditEvent.md) |

## Returns

`void`
