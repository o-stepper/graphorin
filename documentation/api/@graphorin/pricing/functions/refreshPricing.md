[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / refreshPricing

# Function: refreshPricing()

```ts
function refreshPricing(opts): Promise<PricingSnapshot>;
```

Defined in: [packages/pricing/src/refresh.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L63)

Pull a fresh snapshot from the supplied URL and return it. Network
failures and shape mismatches surface as thrown errors so the CLI
can surface them to the operator.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`RefreshPricingOptions`](/api/@graphorin/pricing/interfaces/RefreshPricingOptions.md) |

## Returns

`Promise`\&lt;[`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md)\&gt;

## Stable
