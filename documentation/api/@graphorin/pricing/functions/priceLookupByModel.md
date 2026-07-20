[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / priceLookupByModel

# Function: priceLookupByModel()

```ts
function priceLookupByModel(info): 
  | ModelPriceRates
  | null;
```

Defined in: pricing/src/model-lookup.ts:45

**`Stable`**

Resolve per-Mtok USD rates for a model id against the bundled
snapshot, ignoring the provider dimension. Dated ids fall back to
their dateless alias (the `lookupPrice` contract). Returns `null`
for unknown models so cost accumulators keep reporting zero instead
of guessing.

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
