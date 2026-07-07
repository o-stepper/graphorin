[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / keyringResolver

# Variable: keyringResolver

```ts
const keyringResolver: SecretResolver;
```

Defined in: [packages/security/src/secrets/resolvers/keyring.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/keyring.ts#L85)

Resolver for the `keyring:` scheme. Reads the OS keychain via
`@napi-rs/keyring`. The path component is the account name; an
optional `?service=...` overrides the default service prefix.

## Stable
