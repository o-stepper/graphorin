[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listResolverSchemes

# Function: listResolverSchemes()

```ts
function listResolverSchemes(): readonly string[];
```

Defined in: packages/security/src/secrets/resolvers/registry.ts:82

**`Stable`**

List the schemes for which a resolver is registered. Useful for
`validateSecretRefs(...)` and CLI diagnostics.

## Returns

readonly `string`[]
