[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingDiffEntry

# Interface: PricingDiffEntry

Defined in: pricing/src/types.ts:107

**`Stable`**

Result row reported by [diffPricing](/api/@graphorin/pricing/functions/diffPricing.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-after"></a> `after?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | pricing/src/types.ts:112 |
| <a id="property-before"></a> `before?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | pricing/src/types.ts:111 |
| <a id="property-changedfields"></a> `changedFields?` | `readonly` | readonly keyof [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | pricing/src/types.ts:113 |
| <a id="property-kind"></a> `kind` | `readonly` | `"added"` \| `"removed"` \| `"changed"` | pricing/src/types.ts:110 |
| <a id="property-model"></a> `model` | `readonly` | `string` | pricing/src/types.ts:109 |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | pricing/src/types.ts:108 |
