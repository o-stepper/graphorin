[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithCostTrackingOptions

# Interface: WithCostTrackingOptions

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:35

Options for [withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusage"></a> `onUsage?` | `readonly` | (`info`) => `void` | Hook fired on every `finish` event with the parsed usage. The hook receives the underlying provider's name + modelId so the caller can route into a per-model accumulator. | packages/provider/src/middleware/with-cost-tracking.ts:41 |
| <a id="property-pricelookup"></a> `priceLookup?` | `readonly` | (`info`) => \| \{ `inputPerMtok?`: `number`; `outputPerMtok?`: `number`; \} \| `null` | Optional pricing lookup. When set, the middleware computes `costUsd` from the returned price and surfaces it on the hook. | packages/provider/src/middleware/with-cost-tracking.ts:54 |
