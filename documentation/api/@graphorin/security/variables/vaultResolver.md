[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / vaultResolver

# Variable: vaultResolver

```ts
const vaultResolver: SecretResolver;
```

Defined in: packages/security/src/secrets/resolvers/vault.ts:42

Built-in `vault://` resolver. Acts as a router for an optional
adapter — when no adapter is registered, it raises a typed
resolution error pointing at the documented escape hatch.

## Stable
