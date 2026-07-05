[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RegisterResolverOptions

# Interface: RegisterResolverOptions

Defined in: packages/security/src/secrets/resolvers/registry.ts:29

Options for `registerResolver(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowreplace"></a> `allowReplace?` | `readonly` | `boolean` | When false, throws if a resolver is already registered. Default true. | packages/security/src/secrets/resolvers/registry.ts:31 |
| <a id="property-source"></a> `source?` | `readonly` | `"builtin"` \| `"user"` | Internal flag - used by the built-in resolvers; consumers leave this off. | packages/security/src/secrets/resolvers/registry.ts:33 |
