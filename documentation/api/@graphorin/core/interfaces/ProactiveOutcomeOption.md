[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveOutcomeOption

# Interface: ProactiveOutcomeOption

Defined in: packages/core/src/types/proactive.ts:73

**`Stable`**

One choice offered to the user alongside a `question` / `review`
outcome. Mirrors the channel SPI's delivery-question option shape
(`{ label, value }`) so a messenger keyboard renders it directly.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-label"></a> `label` | `readonly` | `string` | Human-readable button label. | packages/core/src/types/proactive.ts:75 |
| <a id="property-value"></a> `value` | `readonly` | `string` | Opaque value posted back on selection. | packages/core/src/types/proactive.ts:77 |
