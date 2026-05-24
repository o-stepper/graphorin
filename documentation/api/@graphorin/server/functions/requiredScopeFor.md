[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / requiredScopeFor

# Function: requiredScopeFor()

```ts
function requiredScopeFor(subject): ParsedScope;
```

Defined in: packages/server/src/ws/subjects.ts:109

Required scope literal for every subject kind, expressed as a
`ParsedScope`. The matcher `scopeMatches(granted, required)` uses
the standard wildcard rules from `@graphorin/security/auth`
(e.g. `agents:*` matches `agents:invoke:foo`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `subject` | [`ParsedSubject`](/api/@graphorin/server/type-aliases/ParsedSubject.md) |

## Returns

[`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)

## Stable
