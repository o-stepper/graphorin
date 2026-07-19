[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ProviderUsageInfoLike

# Interface: ProviderUsageInfoLike

Defined in: packages/observability/src/cost/delegate.ts:33

**`Stable`**

Structural mirror of the info object `withCostTracking`'s `onUsage`
hook receives (no provider dependency).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cachedreadtokens"></a> `cachedReadTokens?` | `readonly` | `number` | packages/observability/src/cost/delegate.ts:37 |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `readonly` | `number` | packages/observability/src/cost/delegate.ts:38 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | packages/observability/src/cost/delegate.ts:36 |
| <a id="property-costusd"></a> `costUsd` | `readonly` | `number` | packages/observability/src/cost/delegate.ts:39 |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | packages/observability/src/cost/delegate.ts:34 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | packages/observability/src/cost/delegate.ts:35 |
