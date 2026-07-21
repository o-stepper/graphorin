[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatStatus

# Interface: HeartbeatStatus

Defined in: packages/proactive/src/heartbeat.ts:100

**`Stable`**

Live counters surfaced by [Heartbeat.status](/api/@graphorin/proactive/interfaces/Heartbeat.md#status).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-beats"></a> `beats` | `readonly` | `number` | packages/proactive/src/heartbeat.ts:102 |
| <a id="property-defers"></a> `defers` | `readonly` | `number` | packages/proactive/src/heartbeat.ts:105 |
| <a id="property-failures"></a> `failures` | `readonly` | `number` | packages/proactive/src/heartbeat.ts:104 |
| <a id="property-lastbeatat"></a> `lastBeatAt?` | `readonly` | `string` | packages/proactive/src/heartbeat.ts:107 |
| <a id="property-lasterror"></a> `lastError?` | `readonly` | `string` | packages/proactive/src/heartbeat.ts:109 |
| <a id="property-lastoutcomeat"></a> `lastOutcomeAt?` | `readonly` | `string` | packages/proactive/src/heartbeat.ts:108 |
| <a id="property-outcomes"></a> `outcomes` | `readonly` | `number` | packages/proactive/src/heartbeat.ts:103 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/proactive/src/heartbeat.ts:101 |
| <a id="property-skips"></a> `skips` | `readonly` | `Readonly`\<`Record`\&lt;[`HeartbeatSkipReason`](/api/@graphorin/proactive/type-aliases/HeartbeatSkipReason.md), `number`\&gt;\> | packages/proactive/src/heartbeat.ts:106 |
