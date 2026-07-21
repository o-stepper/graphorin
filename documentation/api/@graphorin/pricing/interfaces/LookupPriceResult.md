[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / LookupPriceResult

# Interface: LookupPriceResult

Defined in: pricing/src/types.ts:90

**`Stable`**

Result of [lookupPrice](/api/@graphorin/pricing/functions/lookupPrice.md) when the model is known.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachedreadusdpertoken"></a> `cachedReadUsdPerToken?` | `readonly` | `number` | - | pricing/src/types.ts:93 |
| <a id="property-cachewriteusdpertoken"></a> `cacheWriteUsdPerToken?` | `readonly` | `number` | - | pricing/src/types.ts:94 |
| <a id="property-inputusdpertoken"></a> `inputUsdPerToken` | `readonly` | `number` | - | pricing/src/types.ts:91 |
| <a id="property-outputusdpertoken"></a> `outputUsdPerToken` | `readonly` | `number` | - | pricing/src/types.ts:92 |
| <a id="property-reasoningusdpertoken"></a> `reasoningUsdPerToken?` | `readonly` | `number` | - | pricing/src/types.ts:95 |
| <a id="property-snapshotdate"></a> `snapshotDate` | `readonly` | `string` | - | pricing/src/types.ts:99 |
| <a id="property-source"></a> `source` | `readonly` | `string` | - | pricing/src/types.ts:96 |
| <a id="property-upstreamsources"></a> `upstreamSources?` | `readonly` | readonly `string`[] | Upstream pricing authorities, when the snapshot declares them. | pricing/src/types.ts:98 |
