[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RegisterTriggersResult

# Interface: RegisterTriggersResult

Defined in: packages/memory/src/consolidator/scheduler.ts:112

**`Stable`**

Outcome of [registerConsolidatorTriggers](/api/@graphorin/memory/functions/registerConsolidatorTriggers.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-registered"></a> `registered` | `readonly` | readonly \{ `id`: `string`; `kind`: `"turn"` \| `"idle"` \| `"cron"` \| `"event"` \| `"budget"` \| `"buffer"`; `raw`: `string`; \}[] | packages/memory/src/consolidator/scheduler.ts:113 |
| <a id="property-skipped"></a> `skipped` | `readonly` | readonly \{ `raw`: `string`; `reason`: `"unsupported-by-scheduler"` \| `"filtered-out"`; \}[] | packages/memory/src/consolidator/scheduler.ts:118 |
