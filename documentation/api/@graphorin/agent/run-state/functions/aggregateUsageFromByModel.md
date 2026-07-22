[**Graphorin API reference v0.14.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / aggregateUsageFromByModel

# Function: aggregateUsageFromByModel()

```ts
function aggregateUsageFromByModel(byModel): Usage;
```

Defined in: packages/agent/src/run-state/index.ts:598

**`Stable`**

Recompute the aggregate usage from `usageByModel`. Returns the
sum that callers can compare against `state.usage` to verify the
per-step retry loop maintained the documented invariant.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `byModel` | \| [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) \| `undefined` |

## Returns

[`Usage`](/api/@graphorin/core/interfaces/Usage.md)
