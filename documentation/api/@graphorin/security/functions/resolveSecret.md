[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / resolveSecret

# Function: resolveSecret()

```ts
function resolveSecret(ref, ctx?): Promise<SecretValue>;
```

Defined in: [packages/security/src/secrets/resolvers/registry.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/registry.ts#L138)

Resolve a `SecretRef` (string or parsed) into a `SecretValue` via
the active resolver. Throws `UnknownSchemeError` if no resolver
matches; rewraps non-typed errors thrown by the resolver into a
`SecretResolutionError` so consumers always see a stable error
surface.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | \| `string` \| [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md) \| [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md) |
| `ctx?` | [`SecretResolverContext`](/api/@graphorin/core/interfaces/SecretResolverContext.md) |

## Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/security/classes/SecretValue.md)\&gt;

## Stable
