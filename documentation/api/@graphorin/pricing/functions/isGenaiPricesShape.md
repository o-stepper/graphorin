[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / isGenaiPricesShape

# Function: isGenaiPricesShape()

```ts
function isGenaiPricesShape(body): boolean;
```

Defined in: [packages/pricing/src/convert-genai-prices.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/convert-genai-prices.ts#L76)

Cheap structural detector: does this body look like the
genai-prices dataset (a `providers` array of objects carrying
`models` arrays, or the published bare top-level array of those
provider objects)?

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `unknown` |

## Returns

`boolean`

## Stable
