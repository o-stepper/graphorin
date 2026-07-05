[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TriggerState

# Interface: TriggerState

Defined in: packages/core/src/contracts/trigger-store.ts:8

Persisted trigger state row. Lives in the `trigger_state` table per
the durable-trigger contract: library and server modes share a single
code path.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-callbackref"></a> `callbackRef` | `readonly` | `string` | - | packages/core/src/contracts/trigger-store.ts:12 |
| <a id="property-catchuppolicy"></a> `catchupPolicy` | `readonly` | `"none"` \| `"last"` \| `"all"` | - | packages/core/src/contracts/trigger-store.ts:20 |
| <a id="property-catchupwindowms"></a> `catchupWindowMs` | `readonly` | `number` | - | packages/core/src/contracts/trigger-store.ts:22 |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | packages/core/src/contracts/trigger-store.ts:24 |
| <a id="property-disabled"></a> `disabled` | `readonly` | `boolean` | - | packages/core/src/contracts/trigger-store.ts:19 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/contracts/trigger-store.ts:9 |
| <a id="property-kind"></a> `kind` | `readonly` | `"cron"` \| `"interval"` \| `"idle"` \| `"event"` | - | packages/core/src/contracts/trigger-store.ts:10 |
| <a id="property-lastfiredat"></a> `lastFiredAt?` | `readonly` | `string` | ISO-8601 of the most recent fire. | packages/core/src/contracts/trigger-store.ts:16 |
| <a id="property-maxcatchupruns"></a> `maxCatchupRuns` | `readonly` | `number` | - | packages/core/src/contracts/trigger-store.ts:21 |
| <a id="property-missedfires"></a> `missedFires` | `readonly` | `number` | Number of consecutive missed fires. | packages/core/src/contracts/trigger-store.ts:18 |
| <a id="property-nextfireat"></a> `nextFireAt?` | `readonly` | `string` | ISO-8601 of the next scheduled fire. | packages/core/src/contracts/trigger-store.ts:14 |
| <a id="property-spec"></a> `spec` | `readonly` | `string` | - | packages/core/src/contracts/trigger-store.ts:11 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/core/src/contracts/trigger-store.ts:23 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | - | packages/core/src/contracts/trigger-store.ts:25 |
