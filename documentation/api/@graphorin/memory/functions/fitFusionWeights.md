[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / fitFusionWeights

# Function: fitFusionWeights()

```ts
function fitFusionWeights<TRecord>(cases, options?): FitFusionResult;
```

Defined in: packages/memory/src/search/fit-weights.ts:77

**`Stable`**

Grid-search fusion weights against labelled cases.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cases` | readonly [`FitFusionCase`](/api/@graphorin/memory/interfaces/FitFusionCase.md)\&lt;`TRecord`\&gt;[] |
| `options` | [`FitFusionOptions`](/api/@graphorin/memory/interfaces/FitFusionOptions.md) |

## Returns

[`FitFusionResult`](/api/@graphorin/memory/interfaces/FitFusionResult.md)
