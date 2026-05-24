[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelUsage

# Interface: ModelUsage

Defined in: packages/core/src/types/usage.ts:37

Per-model breakdown used by aggregators (e.g. `CostTracker` in
`@graphorin/observability`).

## Stable

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-callcount"></a> `callCount` | `number` | packages/core/src/types/usage.ts:44 |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | packages/core/src/types/usage.ts:40 |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | packages/core/src/types/usage.ts:43 |
| <a id="property-modelid"></a> `modelId` | `string` | packages/core/src/types/usage.ts:38 |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | packages/core/src/types/usage.ts:39 |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | packages/core/src/types/usage.ts:41 |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | packages/core/src/types/usage.ts:42 |
