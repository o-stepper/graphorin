[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / createCostAccumulator

# Function: createCostAccumulator()

```ts
function createCostAccumulator(): CostAccumulator;
```

Defined in: [packages/provider/src/middleware/with-cost-tracking.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L69)

Create a [CostAccumulator](/api/@graphorin/provider/interfaces/CostAccumulator.md) - the process-local accumulator described on
[withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md). Keys totals by `'<providerName>::<modelId>'`.

## Returns

[`CostAccumulator`](/api/@graphorin/provider/interfaces/CostAccumulator.md)

## Stable
