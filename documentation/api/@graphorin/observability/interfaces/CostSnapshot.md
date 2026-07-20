[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostSnapshot

# Interface: CostSnapshot

Defined in: packages/observability/src/cost/types.ts:49

**`Stable`**

Snapshot returned by [CostTracker.usage](/api/@graphorin/observability/interfaces/CostTracker.md#usage).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bymodel"></a> `byModel` | `readonly` | readonly \{ `cachedReadTokens`: `number`; `cacheWriteTokens`: `number`; `callCount`: `number`; `completionTokens`: `number`; `cost`: [`Cost`](/api/@graphorin/core/interfaces/Cost.md) \| `null`; `mixedCurrency`: `boolean`; `model`: `string`; `promptTokens`: `number`; `reasoningTokens`: `number`; \}[] | - | packages/observability/src/cost/types.ts:71 |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens` | `readonly` | `number` | Aggregated prompt-cache READ tokens (0 when never recorded). | packages/observability/src/cost/types.ts:55 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens` | `readonly` | `number` | Aggregated prompt-cache WRITE tokens (0 when never recorded). | packages/observability/src/cost/types.ts:57 |
| <a id="property-callcount"></a> `callCount` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:58 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:52 |
| <a id="property-cost"></a> `cost` | `readonly` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) \| `null` | Aggregated cost in WHOLE currency units (for USD - dollars, fractional values expected). Same convention as core `Cost.amount` and `@graphorin/pricing.calculateCost` - never minor units. | packages/observability/src/cost/types.ts:64 |
| <a id="property-mixedcurrency"></a> `mixedCurrency` | `readonly` | `boolean` | `true` when records carrying differing currencies were aggregated into this snapshot. `cost.amount` is then a sum across currencies and must not be treated as a single clean figure. | packages/observability/src/cost/types.ts:70 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:51 |
| <a id="property-reasoningtokens"></a> `reasoningTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:53 |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | - | packages/observability/src/cost/types.ts:50 |
