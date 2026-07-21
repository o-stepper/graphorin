[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryPointMatcher

# Type Alias: MemoryPointMatcher

```ts
type MemoryPointMatcher = (gold, observed) => boolean;
```

Defined in: packages/evals/src/scorers/memory/util.ts:17

**`Stable`**

Decides whether an observed memory point expresses a gold point.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `gold` | `string` |
| `observed` | `string` |

## Returns

`boolean`
