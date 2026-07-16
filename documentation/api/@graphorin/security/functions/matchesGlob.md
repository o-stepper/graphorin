[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / matchesGlob

# Function: matchesGlob()

```ts
function matchesGlob(packageName, pattern): boolean;
```

Defined in: [packages/security/src/supply-chain/policy.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/policy.ts#L200)

Glob match for npm package patterns. Implements:

- `@org/*` matches every package in the scope.
- `*` matches a single segment (no `/`).
- Plain strings match exactly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `packageName` | `string` |
| `pattern` | `string` |

## Returns

`boolean`

## Stable
