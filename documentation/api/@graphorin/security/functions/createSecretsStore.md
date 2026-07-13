[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createSecretsStore

# Function: createSecretsStore()

```ts
function createSecretsStore(opts?): Promise<SecretsStore>;
```

Defined in: [packages/security/src/secrets/factory.ts:312](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/factory.ts#L312)

Activate a `SecretsStore` for the current process. The result is
cached; subsequent calls overwrite the previous active store and
re-wire the `ref:` resolver.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CreateSecretsStoreOptions`](/api/@graphorin/security/interfaces/CreateSecretsStoreOptions.md) |

## Returns

`Promise`\&lt;[`SecretsStore`](/api/@graphorin/core/interfaces/SecretsStore.md)\&gt;

## Stable
