[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / WithSecretListener

# Type Alias: WithSecretListener

```ts
type WithSecretListener = (event) => void;
```

Defined in: packages/security/src/secrets/acl.ts:149

**`Stable`**

Callback shape accepted by [onWithSecretAudit](/api/@graphorin/security/functions/onWithSecretAudit.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`WithSecretAuditEvent`](/api/@graphorin/security/interfaces/WithSecretAuditEvent.md) |

## Returns

`void`
