[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WsDispatcherOptions

# Interface: WsDispatcherOptions

Defined in: packages/server/src/ws/dispatcher.ts:37

Public configuration accepted by [createWsDispatcher](/api/@graphorin/server/functions/createWsDispatcher.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentary"></a> `commentary?` | `readonly` | [`DeliveryCommentaryConfig`](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md) | - | packages/server/src/ws/dispatcher.ts:38 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/ws/dispatcher.ts:45 |
| <a id="property-onwarn"></a> `onWarn?` | `readonly` | (`event`) => `void` | Logger sink for protocol violations + dropped frames. When omitted, the dispatcher is silent (production wiring uses the server's structured logger). | packages/server/src/ws/dispatcher.ts:51 |
| <a id="property-perconnectionqueuelimit"></a> `perConnectionQueueLimit?` | `readonly` | `number` | Cap on outstanding events queued for an offline subscriber. Defaults to the same value as the replay buffer per-subject cap. | packages/server/src/ws/dispatcher.ts:44 |
| <a id="property-replaybuffer"></a> `replayBuffer?` | `readonly` | [`ReplayBufferOptions`](/api/@graphorin/server/interfaces/ReplayBufferOptions.md) | - | packages/server/src/ws/dispatcher.ts:39 |
