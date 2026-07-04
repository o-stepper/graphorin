[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelUsage

# Interface: ModelUsage

Defined in: packages/core/src/types/usage.ts:59

Per-model breakdown used by aggregators (e.g. `CostTracker` in
`@graphorin/observability`).

## Stable

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `number` | packages/core/src/types/usage.ts:64 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `number` | packages/core/src/types/usage.ts:65 |
| <a id="property-callcount"></a> `callCount` | `number` | packages/core/src/types/usage.ts:68 |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | packages/core/src/types/usage.ts:62 |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | packages/core/src/types/usage.ts:67 |
| <a id="property-modelid"></a> `modelId` | `string` | packages/core/src/types/usage.ts:60 |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | packages/core/src/types/usage.ts:61 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | packages/core/src/types/usage.ts:63 |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | packages/core/src/types/usage.ts:66 |
