[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / GenaiPricesConversion

# Interface: GenaiPricesConversion

Defined in: pricing/src/convert-genai-prices.ts:53

**`Stable`**

Result of [convertGenaiPrices](/api/@graphorin/pricing/functions/convertGenaiPrices.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | pricing/src/convert-genai-prices.ts:54 |
| <a id="property-skipped"></a> `skipped` | `readonly` | `number` | Model entries the supported subset could not represent. | pricing/src/convert-genai-prices.ts:56 |
