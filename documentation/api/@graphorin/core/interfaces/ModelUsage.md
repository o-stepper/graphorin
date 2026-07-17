[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ModelUsage

# Interface: ModelUsage

Defined in: [packages/core/src/types/usage.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L69)

Per-model breakdown used by aggregators (e.g. `CostTracker` in
`@graphorin/observability`).

## Stable

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `number` | [packages/core/src/types/usage.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L74) |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `number` | [packages/core/src/types/usage.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L75) |
| <a id="property-callcount"></a> `callCount` | `number` | [packages/core/src/types/usage.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L78) |
| <a id="property-completiontokens"></a> `completionTokens` | `number` | [packages/core/src/types/usage.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L72) |
| <a id="property-cost"></a> `cost?` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) | [packages/core/src/types/usage.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L77) |
| <a id="property-modelid"></a> `modelId` | `string` | [packages/core/src/types/usage.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L70) |
| <a id="property-prompttokens"></a> `promptTokens` | `number` | [packages/core/src/types/usage.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L71) |
| <a id="property-reasoningtokens"></a> `reasoningTokens?` | `number` | [packages/core/src/types/usage.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L73) |
| <a id="property-totaltokens"></a> `totalTokens` | `number` | [packages/core/src/types/usage.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L76) |
