[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / convertGenaiPrices

# Function: convertGenaiPrices()

```ts
function convertGenaiPrices(body): GenaiPricesConversion;
```

Defined in: [packages/pricing/src/convert-genai-prices.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L92)

Convert a genai-prices dataset body. Tolerant: unrepresentable model
entries are counted in `skipped`, never thrown on.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `unknown` |

## Returns

[`GenaiPricesConversion`](/api/@graphorin/pricing/interfaces/GenaiPricesConversion.md)

## Stable
