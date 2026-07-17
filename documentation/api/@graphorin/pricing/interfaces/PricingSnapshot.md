[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / PricingSnapshot

# Interface: PricingSnapshot

Defined in: [packages/pricing/src/types.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L47)

Single bundled snapshot.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conversion"></a> `conversion?` | `readonly` | \{ `format`: `"genai-prices"`; `skipped`: `number`; \} | W-097: present when `refreshPricing` converted a foreign dataset (today: `@pydantic/genai-prices`) instead of consuming the native shape. `skipped` counts model entries the supported subset could not represent (tiered / conditional pricing). | [packages/pricing/src/types.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L60) |
| `conversion.format` | `readonly` | `"genai-prices"` | - | [packages/pricing/src/types.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L61) |
| `conversion.skipped` | `readonly` | `number` | - | [packages/pricing/src/types.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L62) |
| <a id="property-currency"></a> `currency` | `readonly` | `"USD"` | - | [packages/pricing/src/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L51) |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] | - | [packages/pricing/src/types.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L53) |
| <a id="property-sha256"></a> `sha256` | `readonly` | `string` | - | [packages/pricing/src/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L52) |
| <a id="property-snapshotdate"></a> `snapshotDate` | `readonly` | `string` | - | [packages/pricing/src/types.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L50) |
| <a id="property-source"></a> `source` | `readonly` | `string` | - | [packages/pricing/src/types.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L49) |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | [packages/pricing/src/types.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L48) |
