[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / envResolver

# Variable: envResolver

```ts
const envResolver: SecretResolver;
```

Defined in: [packages/security/src/secrets/resolvers/env.ts:15](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/env.ts#L15)

Resolver for the `env:` scheme. Reads `process.env[NAME]` and wraps
the result in a `SecretValue`. Honours an optional `?default=...`
fallback. Throws `SecretResolutionError` when the variable is not
set and no fallback is configured.

## Stable
