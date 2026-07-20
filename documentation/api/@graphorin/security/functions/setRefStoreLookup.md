[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / setRefStoreLookup

# Function: setRefStoreLookup()

```ts
function setRefStoreLookup(lookup): void;
```

Defined in: packages/security/src/secrets/resolvers/ref.ts:32

**`Stable`**

Wire up the `ref:` resolver against the active `SecretsStore`. The
factory calls this whenever it activates a new store; tests use it
to inject a deterministic stub.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `lookup` | \| [`RefStoreLookup`](/api/@graphorin/security/type-aliases/RefStoreLookup.md) \| `undefined` |

## Returns

`void`
