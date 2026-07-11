[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / scopeMatches

# Function: scopeMatches()

```ts
function scopeMatches(granted, required): boolean;
```

Defined in: [packages/security/src/auth/scope.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/scope.ts#L107)

Match a single granted scope against a single required scope.

Rules:
- `admin:*` matches every scope.
- Resource segment: must be exact match.
- Action segment: exact match, or granted action `*` matches any
  required action.
- Optional target segment: a granted three-segment scope only
  matches a three-segment requirement; `*` in the granted target
  matches any required target. A granted two-segment scope matches
  a required three-segment scope when the resource and action align
  (a two-segment grant is broader than a three-segment grant).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `granted` | [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md) |
| `required` | [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md) |

## Returns

`boolean`

## Stable
