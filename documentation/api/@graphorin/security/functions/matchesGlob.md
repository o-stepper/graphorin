[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / matchesGlob

# Function: matchesGlob()

```ts
function matchesGlob(packageName, pattern): boolean;
```

Defined in: packages/security/src/supply-chain/policy.ts:200

**`Stable`**

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
