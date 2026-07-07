[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / SecretsSourceFlag

# Type Alias: SecretsSourceFlag

```ts
type SecretsSourceFlag = "auto" | "keyring" | "encrypted-file" | "env";
```

Defined in: [packages/cli/src/commands/start.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/start.ts#L25)

Selector for which `SecretsStore` flavour the server activates at
startup. Mirrors `--secrets-source` from DEC-136.

## Stable
