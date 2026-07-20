[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / validateScopeSet

# Function: validateScopeSet()

```ts
function validateScopeSet(scopes): readonly ScopeParseError[];
```

Defined in: packages/security/src/auth/scope.ts:188

**`Stable`**

Validate that every entry in a granted set is a syntactically valid
scope. Returns the parse errors collected during the walk, or an
empty array if every entry parsed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scopes` | readonly `string`[] |

## Returns

readonly [`ScopeParseError`](/api/@graphorin/security/classes/ScopeParseError.md)[]
