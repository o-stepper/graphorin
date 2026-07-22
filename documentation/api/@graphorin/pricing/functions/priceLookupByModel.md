[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / priceLookupByModel

# Function: priceLookupByModel()

```ts
function priceLookupByModel(info): 
  | ModelPriceRates
  | null;
```

Defined in: pricing/src/model-lookup.ts:46

**`Stable`**

Resolve per-Mtok USD rates for a model id against the bundled
snapshot, ignoring the provider dimension. Dated ids fall back to
their dateless alias, and `-latest` ids resolve like `lookupPrice`
does (dateless entry first, else the single retained dated entry).
Returns `null` for unknown models so cost accumulators keep
reporting zero instead of guessing.

Drop-in for `withCostTracking({ priceLookup })`: the extra
`providerName` the middleware passes is simply ignored.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `info` | \{ `modelId`: `string`; \} |
| `info.modelId` | `string` |

## Returns

  \| [`ModelPriceRates`](/api/@graphorin/pricing/interfaces/ModelPriceRates.md)
  \| `null`
