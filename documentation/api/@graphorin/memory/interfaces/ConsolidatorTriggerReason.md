[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorTriggerReason

# Interface: ConsolidatorTriggerReason

Defined in: packages/memory/src/consolidator/types.ts:50

Triggering reason surfaced through `Consolidator.trigger(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"manual"` | packages/memory/src/consolidator/types.ts:51 |
| <a id="property-value"></a> `value?` | `readonly` | `string` \| `number` | packages/memory/src/consolidator/types.ts:52 |
