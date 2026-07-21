[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getActiveSecretsStore

# Function: getActiveSecretsStore()

```ts
function getActiveSecretsStore(): 
  | SecretsStore
  | undefined;
```

Defined in: packages/security/src/secrets/factory.ts:121

**`Stable`**

Read the currently-active store. Returns `undefined` if
`createSecretsStore(...)` has not been called yet.

## Returns

  \| [`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)
  \| `undefined`
