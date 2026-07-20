[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TokenEnvironment

# Type Alias: TokenEnvironment

```ts
type TokenEnvironment = "live" | "test" | "local";
```

Defined in: packages/security/src/auth/token-format.ts:64

**`Stable`**

Set of accepted environment labels. The library keeps a small,
fixed set so deployments can rely on the label being a stable
routing signal. Operators can extend this by passing a custom
`acceptEnvironments` allowlist into `parseToken(...)`.
