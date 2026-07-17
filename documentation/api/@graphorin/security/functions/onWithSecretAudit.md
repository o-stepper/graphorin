[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / onWithSecretAudit

# Function: onWithSecretAudit()

```ts
function onWithSecretAudit(listener): () => void;
```

Defined in: [packages/security/src/secrets/acl.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/acl.ts#L153)

Subscribe to `withSecret(...)` scope events.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | `WithSecretListener` |

## Returns

() => `void`

## Stable
