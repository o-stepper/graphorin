[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RegisterTriggersResult

# Interface: RegisterTriggersResult

Defined in: packages/memory/src/consolidator/scheduler.ts:99

Outcome of [registerConsolidatorTriggers](/api/@graphorin/memory/functions/registerConsolidatorTriggers.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-registered"></a> `registered` | `readonly` | readonly \{ `id`: `string`; `kind`: `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"`; `raw`: `string`; \}[] | packages/memory/src/consolidator/scheduler.ts:100 |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly \{ `raw`: `string`; `reason`: `"unsupported-by-scheduler"` \| `"filtered-out"`; \}[] | packages/memory/src/consolidator/scheduler.ts:105 |
