[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [ws](/api/@graphorin/server/ws/index.md) / ReplayBufferStats

# Interface: ReplayBufferStats

Defined in: [packages/server/src/ws/replay-buffer.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L43)

Occupancy snapshot returned by [ReplayBuffer.stats](/api/@graphorin/server/interfaces/ReplayBuffer.md#stats).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-events"></a> `events` | `readonly` | `number` | Total buffered events across all subjects. | [packages/server/src/ws/replay-buffer.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L47) |
| <a id="property-subjects"></a> `subjects` | `readonly` | `number` | Number of subjects currently holding at least one buffered event. | [packages/server/src/ws/replay-buffer.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/replay-buffer.ts#L45) |
