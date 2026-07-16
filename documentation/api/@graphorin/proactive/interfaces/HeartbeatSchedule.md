[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatSchedule

# Interface: HeartbeatSchedule

Defined in: [packages/proactive/src/heartbeat.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L38)

When the heartbeat fires. Exactly one of `every` / `cron` is
required. `jitterMs` / `expiresAt` pass through to the trigger
declaration (the C4 scheduler harness).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cron"></a> `cron?` | `readonly` | `string` | 5-field cron expression. | [packages/proactive/src/heartbeat.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L42) |
| <a id="property-every"></a> `every?` | `readonly` | `number` | Fixed interval in milliseconds. | [packages/proactive/src/heartbeat.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L40) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` \| `number` | Auto-pause instant (C4). | [packages/proactive/src/heartbeat.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L48) |
| <a id="property-jitterms"></a> `jitterMs?` | `readonly` | `number` | Deterministic per-id jitter (C4). | [packages/proactive/src/heartbeat.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L46) |
| <a id="property-timezone"></a> `timezone?` | `readonly` | `string` | IANA timezone for the cron expression (W-124). | [packages/proactive/src/heartbeat.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L44) |
