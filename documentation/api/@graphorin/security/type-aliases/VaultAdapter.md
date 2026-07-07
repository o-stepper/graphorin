[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VaultAdapter

# Type Alias: VaultAdapter

```ts
type VaultAdapter = (ref, ctx) => Promise<SecretValue>;
```

Defined in: [packages/security/src/secrets/resolvers/vault.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/vault.ts#L17)

Concrete adapter signature plugged into `setVaultAdapter(...)`. The
built-in resolver only ships the **pattern** - a real Vault adapter
lives in the optional `@graphorin/secret-vault` package (post-MVP).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md) |
| `ctx` | \| [`SecretResolverContext`](/api/@graphorin/core/interfaces/SecretResolverContext.md) \| `undefined` |

## Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)\&gt;

## Stable
