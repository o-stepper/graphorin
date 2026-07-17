[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveOutcomeOption

# Interface: ProactiveOutcomeOption

Defined in: [packages/core/src/types/proactive.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L73)

One choice offered to the user alongside a `question` / `review`
outcome. Mirrors the channel SPI's delivery-question option shape
(`{ label, value }`) so a messenger keyboard renders it directly.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | Human-readable button label. | [packages/core/src/types/proactive.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L75) |
| <a id="property-value"></a> `value` | `readonly` | `string` | Opaque value posted back on selection. | [packages/core/src/types/proactive.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L77) |
