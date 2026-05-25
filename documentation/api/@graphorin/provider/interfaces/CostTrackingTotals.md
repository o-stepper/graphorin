[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CostTrackingTotals

# Interface: CostTrackingTotals

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:22

Aggregated totals exposed via [withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md)'s
`accumulator()` callback.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callcount"></a> `callCount` | `readonly` | `number` | packages/provider/src/middleware/with-cost-tracking.ts:23 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | packages/provider/src/middleware/with-cost-tracking.ts:25 |
| <a id="property-costusd"></a> `costUsd` | `readonly` | `number` | packages/provider/src/middleware/with-cost-tracking.ts:27 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | packages/provider/src/middleware/with-cost-tracking.ts:24 |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | packages/provider/src/middleware/with-cost-tracking.ts:26 |
