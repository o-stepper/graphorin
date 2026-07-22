[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayBufferSlice

# Interface: ReplayBufferSlice

Defined in: packages/server/src/ws/replay-buffer.ts:32

**`Stable`**

Snapshot returned by [ReplayBuffer.replay](/api/@graphorin/server/interfaces/ReplayBuffer.md#replay).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedcount"></a> `droppedCount` | `readonly` | `number` | packages/server/src/ws/replay-buffer.ts:34 |
| <a id="property-events"></a> `events` | `readonly` | readonly \{ `eventId`: `string`; `kind`: `"event"`; `payload?`: `unknown`; `subject`: `string`; `subscriptionId`: `string`; `type`: `string`; `v`: `"1"`; \}[] | packages/server/src/ws/replay-buffer.ts:33 |
| <a id="property-nexteventidhint"></a> `nextEventIdHint` | `readonly` | `string` \| `undefined` | packages/server/src/ws/replay-buffer.ts:35 |
