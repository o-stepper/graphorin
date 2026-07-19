[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getSecretsStoreStatus

# Function: getSecretsStoreStatus()

```ts
function getSecretsStoreStatus(): 
  | SecretsStoreStatus
  | undefined;
```

Defined in: packages/security/src/secrets/factory.ts:111

**`Stable`**

Read the status of the currently-active `SecretsStore`. Returns
`undefined` if `createSecretsStore(...)` has not been called yet.

## Returns

  \| [`SecretsStoreStatus`](/api/@graphorin/security/interfaces/SecretsStoreStatus.md)
  \| `undefined`
