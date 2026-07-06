[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / GenaiPricesConversion

# Interface: GenaiPricesConversion

Defined in: [packages/pricing/src/convert-genai-prices.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L49)

Result of [convertGenaiPrices](/api/@graphorin/pricing/functions/convertGenaiPrices.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | [packages/pricing/src/convert-genai-prices.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L50) |
| <a id="property-skipped"></a> `skipped` | `readonly` | `number` | Model entries the supported subset could not represent. | [packages/pricing/src/convert-genai-prices.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L52) |
