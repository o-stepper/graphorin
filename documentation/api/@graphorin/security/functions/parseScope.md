[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseScope

# Function: parseScope()

```ts
function parseScope(input): ParsedScope;
```

Defined in: packages/security/src/auth/scope.ts:49

**`Stable`**

Parse a single scope string. Throws `ScopeParseError` for any input
that does not match the canonical grammar; never silently coerces.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

## Returns

[`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)
