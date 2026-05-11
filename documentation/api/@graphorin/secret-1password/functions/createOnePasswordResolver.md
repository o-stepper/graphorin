[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / createOnePasswordResolver

# Function: createOnePasswordResolver()

```ts
function createOnePasswordResolver(options?): SecretResolver;
```

Defined in: packages/secret-1password/src/resolver.ts:68

Build a `SecretResolver` that honours the `op://` scheme. Register
with `registerResolver(...)` from `@graphorin/security` at app
bootstrap.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OnePasswordResolverOptions`](/api/@graphorin/secret-1password/interfaces/OnePasswordResolverOptions.md) |

## Returns

[`SecretResolver`](/api/@graphorin/core/interfaces/SecretResolver.md)

## Stable
