[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsStoreKind

# Type Alias: SecretsStoreKind

```ts
type SecretsStoreKind = "auto" | "keyring" | "encrypted-file" | "env" | "memory";
```

Defined in: [packages/security/src/secrets/factory.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/factory.ts#L34)

Identifier of a `SecretsStore` kind. Used by `createSecretsStore(...)`,
the headless detector, and the status reporter.

## Stable
