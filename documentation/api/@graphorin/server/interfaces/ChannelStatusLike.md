[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelStatusLike

# Interface: ChannelStatusLike

Defined in: packages/server/src/channels/daemon.ts:15

**`Stable`**

Per-channel status counters the gateway reports.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-delivered"></a> `delivered` | `readonly` | `number` | packages/server/src/channels/daemon.ts:22 |
| <a id="property-deliveryfailures"></a> `deliveryFailures` | `readonly` | `number` | packages/server/src/channels/daemon.ts:23 |
| <a id="property-denied"></a> `denied` | `readonly` | `number` | packages/server/src/channels/daemon.ts:20 |
| <a id="property-dropped"></a> `dropped` | `readonly` | `number` | packages/server/src/channels/daemon.ts:18 |
| <a id="property-failed"></a> `failed` | `readonly` | `number` | packages/server/src/channels/daemon.ts:21 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/channels/daemon.ts:16 |
| <a id="property-processed"></a> `processed` | `readonly` | `number` | packages/server/src/channels/daemon.ts:19 |
| <a id="property-queued"></a> `queued` | `readonly` | `number` | packages/server/src/channels/daemon.ts:17 |
