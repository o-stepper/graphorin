[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [ws](/api/@graphorin/server/ws/index.md) / isSubjectAllowed

# Function: isSubjectAllowed()

```ts
function isSubjectAllowed(granted, subject): boolean;
```

Defined in: packages/server/src/ws/subjects.ts:153

**`Stable`**

Compatibility shim - re-exports `scopeMatches` so consumers don't
have to learn the security package's surface.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `granted` | readonly [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)[] |
| `subject` | [`ParsedSubject`](/api/@graphorin/server/type-aliases/ParsedSubject.md) |

## Returns

`boolean`
