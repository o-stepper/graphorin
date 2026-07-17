[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / refResolver

# Variable: refResolver

```ts
const refResolver: SecretResolver;
```

Defined in: [packages/security/src/secrets/resolvers/ref.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/ref.ts#L43)

Resolver for the `ref:` scheme. Resolves the path component
through the active `SecretsStore` chain, allowing config files to
stay agnostic about which physical store backs a given key.

## Stable
