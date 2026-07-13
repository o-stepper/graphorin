[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / tokenF1Matcher

# Function: tokenF1Matcher()

```ts
function tokenF1Matcher(minTokenF1?): MemoryPointMatcher;
```

Defined in: [packages/evals/src/scorers/memory/util.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/util.ts#L57)

Build the default matcher: token-set F1 at or above `minTokenF1`
(default `0.5`).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `minTokenF1` | `number` | `0.5` |

## Returns

[`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md)

## Stable
