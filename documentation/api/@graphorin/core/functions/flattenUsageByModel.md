[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / flattenUsageByModel

# Function: flattenUsageByModel()

```ts
function flattenUsageByModel(byModel): readonly ModelUsage[];
```

Defined in: packages/core/src/types/run.ts:296

**`Stable`**

Snapshot helper used by `@graphorin/observability` aggregators to
convert the on-disk `usageByModel` shape into the canonical
[ModelUsage](/api/@graphorin/core/interfaces/ModelUsage.md) array. Pure utility - kept in core so consumers
do not have to take an observability dependency just to flatten a
run-state breakdown.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `byModel` | \| [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) \| `undefined` |

## Returns

readonly [`ModelUsage`](/api/@graphorin/core/interfaces/ModelUsage.md)[]
