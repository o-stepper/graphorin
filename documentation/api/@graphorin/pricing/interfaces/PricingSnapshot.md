[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingSnapshot

# Interface: PricingSnapshot

Defined in: pricing/src/types.ts:47

**`Stable`**

Single bundled snapshot.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conversion"></a> `conversion?` | `readonly` | \{ `format`: `"genai-prices"`; `skipped`: `number`; \} | Present when `refreshPricing` converted a foreign dataset (today: `@pydantic/genai-prices`) instead of consuming the native shape. `skipped` counts model entries the supported subset could not represent (tiered / conditional pricing). | pricing/src/types.ts:68 |
| `conversion.format` | `readonly` | `"genai-prices"` | - | pricing/src/types.ts:69 |
| `conversion.skipped` | `readonly` | `number` | - | pricing/src/types.ts:70 |
| <a id="property-currency"></a> `currency` | `readonly` | `"USD"` | - | pricing/src/types.ts:59 |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | pricing/src/types.ts:61 |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | - | pricing/src/types.ts:60 |
| <a id="property-snapshotdate"></a> `snapshotDate` | `readonly` | `string` | - | pricing/src/types.ts:58 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Where this snapshot artifact itself lives (repo file, refresh URL). | pricing/src/types.ts:50 |
| <a id="property-upstreamsources"></a> `upstreamSources?` | `readonly` | readonly `string`[] | Original pricing authorities the numbers were transcribed from (provider pricing pages, upstream datasets), valid as of `snapshotDate`. Lets an external audit follow the chain artifact -> upstream without guessing. | pricing/src/types.ts:57 |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | pricing/src/types.ts:48 |
