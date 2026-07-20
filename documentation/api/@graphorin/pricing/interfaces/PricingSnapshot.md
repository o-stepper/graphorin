[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingSnapshot

# Interface: PricingSnapshot

Defined in: pricing/src/types.ts:47

**`Stable`**

Single bundled snapshot.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conversion"></a> `conversion?` | `readonly` | \{ `format`: `"genai-prices"`; `skipped`: `number`; \} | Present when `refreshPricing` converted a foreign dataset (today: `@pydantic/genai-prices`) instead of consuming the native shape. `skipped` counts model entries the supported subset could not represent (tiered / conditional pricing). | pricing/src/types.ts:60 |
| `conversion.format` | `readonly` | `"genai-prices"` | - | pricing/src/types.ts:61 |
| `conversion.skipped` | `readonly` | `number` | - | pricing/src/types.ts:62 |
| <a id="property-currency"></a> `currency` | `readonly` | `"USD"` | - | pricing/src/types.ts:51 |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | pricing/src/types.ts:53 |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | - | pricing/src/types.ts:52 |
| <a id="property-snapshotdate"></a> `snapshotDate` | `readonly` | `string` | - | pricing/src/types.ts:50 |
| <a id="property-source"></a> `source` | `readonly` | `string` | - | pricing/src/types.ts:49 |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | pricing/src/types.ts:48 |
