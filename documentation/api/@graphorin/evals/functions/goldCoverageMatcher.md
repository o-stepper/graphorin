[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / goldCoverageMatcher

# Function: goldCoverageMatcher()

```ts
function goldCoverageMatcher(minGoldCoverage?): MemoryPointMatcher;
```

Defined in: packages/evals/src/scorers/memory/util.ts:151

**`Stable`**

Build a directional matcher: [goldTokenCoverage](/api/@graphorin/evals/functions/goldTokenCoverage.md) at or above
`minGoldCoverage` (default `0.6`).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `minGoldCoverage` | `number` | `0.6` |

## Returns

[`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md)
