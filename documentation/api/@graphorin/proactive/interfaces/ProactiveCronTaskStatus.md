[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveCronTaskStatus

# Interface: ProactiveCronTaskStatus

Defined in: packages/proactive/src/cron-task.ts:92

**`Stable`**

Live counters surfaced by [ProactiveCronTask.status](/api/@graphorin/proactive/interfaces/ProactiveCronTask.md#status).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-escalationsblocked"></a> `escalationsBlocked` | `readonly` | `number` | packages/proactive/src/cron-task.ts:97 |
| <a id="property-failures"></a> `failures` | `readonly` | `number` | packages/proactive/src/cron-task.ts:96 |
| <a id="property-fires"></a> `fires` | `readonly` | `number` | packages/proactive/src/cron-task.ts:94 |
| <a id="property-lasterror"></a> `lastError?` | `readonly` | `string` | packages/proactive/src/cron-task.ts:101 |
| <a id="property-lastfireat"></a> `lastFireAt?` | `readonly` | `string` | packages/proactive/src/cron-task.ts:99 |
| <a id="property-lastoutcomeat"></a> `lastOutcomeAt?` | `readonly` | `string` | packages/proactive/src/cron-task.ts:100 |
| <a id="property-outcomes"></a> `outcomes` | `readonly` | `number` | packages/proactive/src/cron-task.ts:95 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/proactive/src/cron-task.ts:93 |
| <a id="property-skips"></a> `skips` | `readonly` | `Readonly`\<`Record`\&lt;[`ProactiveTaskSkipReason`](/api/@graphorin/proactive/type-aliases/ProactiveTaskSkipReason.md), `number`\&gt;\> | packages/proactive/src/cron-task.ts:98 |
