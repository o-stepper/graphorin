[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onWithSecretAudit

# Function: onWithSecretAudit()

```ts
function onWithSecretAudit(listener): () => void;
```

Defined in: packages/security/src/secrets/acl.ts:158

**`Stable`**

Subscribe to `withSecret(...)` scope events.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`WithSecretListener`](/api/@graphorin/security/type-aliases/WithSecretListener.md) |

## Returns

() => `void`
