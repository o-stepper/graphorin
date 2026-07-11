[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / lookupPrice

# Function: lookupPrice()

```ts
function lookupPrice(args, snapshot?): 
  | LookupPriceResult
  | null;
```

Defined in: [packages/pricing/src/lookup.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/lookup.ts#L43)

Resolve a per-token price for the (provider, model) pair. Returns
`null` when the snapshot does not contain an entry for the model.

The function emits one WARN per process per unknown (provider, model)
pair so cost dashboards surface drift without spamming the log.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `args` | [`LookupPriceArgs`](/api/@graphorin/pricing/interfaces/LookupPriceArgs.md) | `undefined` |
| `snapshot` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) | `BUNDLED_SNAPSHOT` |

## Returns

  \| [`LookupPriceResult`](/api/@graphorin/pricing/interfaces/LookupPriceResult.md)
  \| `null`

## Stable
