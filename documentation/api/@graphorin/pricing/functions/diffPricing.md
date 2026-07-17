[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / diffPricing

# Function: diffPricing()

```ts
function diffPricing(before, after): readonly PricingDiffEntry[];
```

Defined in: [packages/pricing/src/diff.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/diff.ts#L28)

Compare two snapshots and return one entry per (provider, model)
pair that has been added, removed, or changed. The result is sorted
by `(provider, model, kind)` for deterministic output.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `before` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) |
| `after` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) |

## Returns

readonly [`PricingDiffEntry`](/api/@graphorin/pricing/interfaces/PricingDiffEntry.md)[]

## Stable
