[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / listMissingModels

# Function: listMissingModels()

```ts
function listMissingModels(spans, snapshot?): readonly MissingModelEntry[];
```

Defined in: pricing/src/missing.ts:35

**`Stable`**

Return one entry per (provider, model) pair that the snapshot does
not recognise, sorted by descending occurrence count.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `spans` | `Iterable`\&lt;[`PricingTraceSpanLike`](/api/@graphorin/pricing/interfaces/PricingTraceSpanLike.md)\&gt; | `undefined` |
| `snapshot` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) | `BUNDLED_SNAPSHOT` |

## Returns

readonly [`MissingModelEntry`](/api/@graphorin/pricing/interfaces/MissingModelEntry.md)[]
