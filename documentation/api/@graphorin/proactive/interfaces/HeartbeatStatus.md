[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatStatus

# Interface: HeartbeatStatus

Defined in: [packages/proactive/src/heartbeat.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L100)

Live counters surfaced by [Heartbeat.status](/api/@graphorin/proactive/interfaces/Heartbeat.md#status).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-beats"></a> `beats` | `readonly` | `number` | [packages/proactive/src/heartbeat.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L102) |
| <a id="property-defers"></a> `defers` | `readonly` | `number` | [packages/proactive/src/heartbeat.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L105) |
| <a id="property-failures"></a> `failures` | `readonly` | `number` | [packages/proactive/src/heartbeat.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L104) |
| <a id="property-lastbeatat"></a> `lastBeatAt?` | `readonly` | `string` | [packages/proactive/src/heartbeat.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L107) |
| <a id="property-lasterror"></a> `lastError?` | `readonly` | `string` | [packages/proactive/src/heartbeat.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L109) |
| <a id="property-lastoutcomeat"></a> `lastOutcomeAt?` | `readonly` | `string` | [packages/proactive/src/heartbeat.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L108) |
| <a id="property-outcomes"></a> `outcomes` | `readonly` | `number` | [packages/proactive/src/heartbeat.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L103) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | [packages/proactive/src/heartbeat.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L101) |
| <a id="property-skips"></a> `skips` | `readonly` | `Readonly`\<`Record`\&lt;[`HeartbeatSkipReason`](/api/@graphorin/proactive/type-aliases/HeartbeatSkipReason.md), `number`\&gt;\> | [packages/proactive/src/heartbeat.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L106) |
