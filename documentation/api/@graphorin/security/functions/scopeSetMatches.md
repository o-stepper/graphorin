[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / scopeSetMatches

# Function: scopeSetMatches()

```ts
function scopeSetMatches(granted, required): boolean;
```

Defined in: packages/security/src/auth/scope.ts:127

Match a granted set against a required scope. Strings inside
`granted` that fail to parse are skipped (they cannot grant
anything).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `granted` | readonly ( \| `string` \| [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md))[] |
| `required` | \| `string` \| [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md) |

## Returns

`boolean`

## Stable
