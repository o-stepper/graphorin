[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveCronSchedule

# Interface: ProactiveCronSchedule

Defined in: packages/proactive/src/cron-task.ts:58

**`Stable`**

When the task fires. C4 harness fields pass through.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cron"></a> `cron` | `readonly` | `string` | 5-field cron expression. | packages/proactive/src/cron-task.ts:60 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` \| `number` | Auto-pause instant (C4). | packages/proactive/src/cron-task.ts:66 |
| <a id="property-jitterms"></a> `jitterMs?` | `readonly` | `number` | Deterministic per-id jitter (C4). | packages/proactive/src/cron-task.ts:64 |
| <a id="property-timezone"></a> `timezone?` | `readonly` | `string` | IANA timezone for the expression (W-124). | packages/proactive/src/cron-task.ts:62 |
