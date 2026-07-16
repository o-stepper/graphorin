[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / listResolverSchemes

# Function: listResolverSchemes()

```ts
function listResolverSchemes(): readonly string[];
```

Defined in: [packages/security/src/secrets/resolvers/registry.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/registry.ts#L82)

List the schemes for which a resolver is registered. Useful for
`validateSecretRefs(...)` and CLI diagnostics.

## Returns

readonly `string`[]

## Stable
