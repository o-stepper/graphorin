[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / requiredScopeFor

# Function: requiredScopeFor()

```ts
function requiredScopeFor(subject): ParsedScope;
```

Defined in: [packages/server/src/ws/subjects.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/subjects.ts#L122)

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
