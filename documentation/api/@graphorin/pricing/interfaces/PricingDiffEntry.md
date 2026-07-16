[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingDiffEntry

# Interface: PricingDiffEntry

Defined in: [packages/pricing/src/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L97)

Result row reported by [diffPricing](/api/@graphorin/pricing/functions/diffPricing.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-after"></a> `after?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | [packages/pricing/src/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L102) |
| <a id="property-before"></a> `before?` | `readonly` | [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md) | [packages/pricing/src/types.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L101) |
| <a id="property-changedfields"></a> `changedFields?` | `readonly` | readonly keyof [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | [packages/pricing/src/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L103) |
| <a id="property-kind"></a> `kind` | `readonly` | `"added"` \| `"removed"` \| `"changed"` | [packages/pricing/src/types.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L100) |
| <a id="property-model"></a> `model` | `readonly` | `string` | [packages/pricing/src/types.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L99) |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | [packages/pricing/src/types.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L98) |
