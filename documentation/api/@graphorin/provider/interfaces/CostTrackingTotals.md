[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CostTrackingTotals

# Interface: CostTrackingTotals

Defined in: [packages/provider/src/middleware/with-cost-tracking.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L22)

Aggregated totals for one `provider × model`, returned by
[CostAccumulator.totalFor](/api/@graphorin/provider/interfaces/CostAccumulator.md#totalfor) / [CostAccumulator.totals](/api/@graphorin/provider/interfaces/CostAccumulator.md#totals).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens` | `readonly` | `number` | Prompt tokens served from the provider cache (subset of promptTokens). | [packages/provider/src/middleware/with-cost-tracking.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L28) |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens` | `readonly` | `number` | Prompt tokens written to the provider cache (subset of promptTokens). | [packages/provider/src/middleware/with-cost-tracking.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L30) |
| <a id="property-callcount"></a> `callCount` | `readonly` | `number` | - | [packages/provider/src/middleware/with-cost-tracking.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L23) |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | - | [packages/provider/src/middleware/with-cost-tracking.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L25) |
| <a id="property-costusd"></a> `costUsd` | `readonly` | `number` | - | [packages/provider/src/middleware/with-cost-tracking.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L31) |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | - | [packages/provider/src/middleware/with-cost-tracking.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L24) |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | - | [packages/provider/src/middleware/with-cost-tracking.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-cost-tracking.ts#L26) |
