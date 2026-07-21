[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getResolver

# Function: getResolver()

```ts
function getResolver(scheme): 
  | SecretResolver
  | undefined;
```

Defined in: packages/security/src/secrets/resolvers/registry.ts:72

**`Stable`**

Look up the resolver registered for `scheme`. Returns `undefined` if
no resolver matches.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scheme` | `string` |

## Returns

  \| [`SecretResolver`](/api/@graphorin/core/interfaces/SecretResolver.md)
  \| `undefined`
