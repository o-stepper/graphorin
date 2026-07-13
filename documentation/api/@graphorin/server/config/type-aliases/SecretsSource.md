[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / SecretsSource

# Type Alias: SecretsSource

```ts
type SecretsSource = "auto" | "keyring" | "encrypted-file" | "env";
```

Defined in: [packages/server/src/config.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L37)

Selector for which `SecretsStore` flavour the server activates.
Mirrors `--secrets-source` from DEC-136.

## Stable
