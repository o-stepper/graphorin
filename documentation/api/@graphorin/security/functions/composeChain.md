[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / composeChain

# Function: composeChain()

```ts
function composeChain(stores): SecretsStore;
```

Defined in: packages/security/src/secrets/factory.ts:173

Compose multiple stores into a try-in-order chain. The first non-null
value wins; writes go to the first writable store.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `stores` | readonly [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)[] |

## Returns

[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)

## Stable
