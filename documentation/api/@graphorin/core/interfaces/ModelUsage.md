[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelUsage

# Interface: ModelUsage

Defined in: packages/core/src/types/usage.ts:69

**`Stable`**

Per-model breakdown used by aggregators (e.g. `CostTracker` in
`@graphorin/observability`).

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `number` | packages/core/src/types/usage.ts:74 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `number` | packages/core/src/types/usage.ts:75 |
| <a id="property-callcount"></a> `callCount` | `number` | packages/core/src/types/usage.ts:78 |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | packages/core/src/types/usage.ts:72 |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | packages/core/src/types/usage.ts:77 |
| <a id="property-modelid"></a> `modelId` | `string` | packages/core/src/types/usage.ts:70 |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | packages/core/src/types/usage.ts:71 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | packages/core/src/types/usage.ts:73 |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | packages/core/src/types/usage.ts:76 |
