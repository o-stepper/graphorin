[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorTriggerReason

# Interface: ConsolidatorTriggerReason

Defined in: packages/memory/src/consolidator/types.ts:87

**`Stable`**

Triggering reason surfaced through `Consolidator.trigger(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"buffer"` \| `"manual"` | packages/memory/src/consolidator/types.ts:88 |
| <a id="property-value"></a> `value?` | `readonly` | `string` \| `number` | packages/memory/src/consolidator/types.ts:89 |
