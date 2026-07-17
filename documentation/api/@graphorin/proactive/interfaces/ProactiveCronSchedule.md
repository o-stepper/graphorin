[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveCronSchedule

# Interface: ProactiveCronSchedule

Defined in: [packages/proactive/src/cron-task.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L58)

When the task fires. C4 harness fields pass through.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cron"></a> `cron` | `readonly` | `string` | 5-field cron expression. | [packages/proactive/src/cron-task.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L60) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` \| `number` | Auto-pause instant (C4). | [packages/proactive/src/cron-task.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L66) |
| <a id="property-jitterms"></a> `jitterMs?` | `readonly` | `number` | Deterministic per-id jitter (C4). | [packages/proactive/src/cron-task.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L64) |
| <a id="property-timezone"></a> `timezone?` | `readonly` | `string` | IANA timezone for the expression (W-124). | [packages/proactive/src/cron-task.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L62) |
