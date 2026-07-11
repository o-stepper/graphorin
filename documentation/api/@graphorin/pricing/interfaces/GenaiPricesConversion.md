[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / GenaiPricesConversion

# Interface: GenaiPricesConversion

Defined in: [packages/pricing/src/convert-genai-prices.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L53)

Result of [convertGenaiPrices](/api/@graphorin/pricing/functions/convertGenaiPrices.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | [packages/pricing/src/convert-genai-prices.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L54) |
| <a id="property-skipped"></a> `skipped` | `readonly` | `number` | Model entries the supported subset could not represent. | [packages/pricing/src/convert-genai-prices.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L56) |
