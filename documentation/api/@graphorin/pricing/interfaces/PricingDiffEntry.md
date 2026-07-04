[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingDiffEntry

# Interface: PricingDiffEntry

Defined in: pricing/src/types.ts:87

Result row reported by [diffPricing](/api/@graphorin/pricing/functions/diffPricing.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-after"></a> `after?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | pricing/src/types.ts:92 |
| <a id="property-before"></a> `before?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | pricing/src/types.ts:91 |
| <a id="property-changedfields"></a> `changedFields?` | `readonly` | readonly keyof [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | pricing/src/types.ts:93 |
| <a id="property-kind"></a> `kind` | `readonly` | `"added"` \| `"removed"` \| `"changed"` | pricing/src/types.ts:90 |
| <a id="property-model"></a> `model` | `readonly` | `string` | pricing/src/types.ts:89 |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | pricing/src/types.ts:88 |
