[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryPointMatcher

# Type Alias: MemoryPointMatcher

```ts
type MemoryPointMatcher = (gold, observed) => boolean;
```

Defined in: [packages/evals/src/scorers/memory/util.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/util.ts#L17)

Decides whether an observed memory point expresses a gold point.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `gold` | `string` |
| `observed` | `string` |

## Returns

`boolean`

## Stable
