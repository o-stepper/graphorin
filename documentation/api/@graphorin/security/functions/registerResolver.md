[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / registerResolver

# Function: registerResolver()

```ts
function registerResolver(resolver, opts?): 
  | SecretResolver
  | undefined;
```

Defined in: packages/security/src/secrets/resolvers/registry.ts:43

Register a resolver for a single scheme. Last registration wins by
default, matching the documented "pluggable resolver" contract; pass
`{ allowReplace: false }` to force strict registration semantics.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `resolver` | [`SecretResolver`](/api/@graphorin/core/interfaces/SecretResolver.md) |
| `opts` | [`RegisterResolverOptions`](/api/@graphorin/security/interfaces/RegisterResolverOptions.md) |

## Returns

  \| [`SecretResolver`](/api/@graphorin/core/interfaces/SecretResolver.md)
  \| `undefined`

## Stable
