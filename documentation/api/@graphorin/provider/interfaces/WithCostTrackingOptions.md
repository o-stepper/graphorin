[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithCostTrackingOptions

# Interface: WithCostTrackingOptions

Defined in: packages/provider/src/middleware/with-cost-tracking.ts:97

**`Stable`**

Options for [withCostTracking](/api/@graphorin/provider/variables/withCostTracking.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onusage"></a> `onUsage?` | `readonly` | (`info`) => `void` | Hook fired on every `finish` event with the parsed usage. The hook receives the underlying provider's name + modelId so the caller can route into a per-model accumulator. | packages/provider/src/middleware/with-cost-tracking.ts:103 |
| <a id="property-pricelookup"></a> `priceLookup?` | `readonly` | (`info`) => \| \{ `cachedReadPerMtok?`: `number`; `cacheWritePerMtok?`: `number`; `inputPerMtok?`: `number`; `outputPerMtok?`: `number`; \} \| `null` | Optional pricing lookup. When set, the middleware computes `costUsd` from the returned price and surfaces it on the hook. `cachedReadPerMtok` / `cacheWritePerMtok` price the prompt-cache legs; when omitted, cache tokens are billed at the full input rate. For reads that over-counts (reads are discounted), but for writes it can UNDER-count: providers with a write premium (Anthropic, and OpenAI from GPT-5.6 on) charge 1.25x input for cache writes, so keep the write rate populated for models that report `cacheWriteTokens`. | packages/provider/src/middleware/with-cost-tracking.ts:125 |
