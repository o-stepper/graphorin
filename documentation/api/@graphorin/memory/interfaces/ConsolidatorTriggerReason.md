[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorTriggerReason

# Interface: ConsolidatorTriggerReason

Defined in: [packages/memory/src/consolidator/types.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L50)

Triggering reason surfaced through `Consolidator.trigger(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"manual"` | [packages/memory/src/consolidator/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L51) |
| <a id="property-value"></a> `value?` | `readonly` | `string` \| `number` | [packages/memory/src/consolidator/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L52) |
