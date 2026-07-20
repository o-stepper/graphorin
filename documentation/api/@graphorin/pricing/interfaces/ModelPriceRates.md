[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / ModelPriceRates

# Interface: ModelPriceRates

Defined in: pricing/src/model-lookup.ts:26

**`Stable`**

Per-Mtok USD rates for one model, shaped for the `priceLookup`
option of `@graphorin/provider`'s `withCostTracking` middleware.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cachedreadpermtok"></a> `cachedReadPerMtok?` | `readonly` | `number` | pricing/src/model-lookup.ts:29 |
| <a id="property-cachewritepermtok"></a> `cacheWritePerMtok?` | `readonly` | `number` | pricing/src/model-lookup.ts:30 |
| <a id="property-inputpermtok"></a> `inputPerMtok?` | `readonly` | `number` | pricing/src/model-lookup.ts:27 |
| <a id="property-outputpermtok"></a> `outputPerMtok?` | `readonly` | `number` | pricing/src/model-lookup.ts:28 |
