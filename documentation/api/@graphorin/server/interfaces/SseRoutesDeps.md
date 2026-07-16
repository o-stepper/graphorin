[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SseRoutesDeps

# Interface: SseRoutesDeps

Defined in: [packages/server/src/sse/events.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L43)

Stable shape consumed by [createSseRoutes](/api/@graphorin/server/functions/createSseRoutes.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentary"></a> `commentary?` | `readonly` | [`DeliveryCommentaryConfig`](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md) | - | [packages/server/src/sse/events.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L51) |
| <a id="property-dispatcher"></a> `dispatcher` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | - | [packages/server/src/sse/events.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L50) |
| <a id="property-keepalivems"></a> `keepAliveMs?` | `readonly` | `number` | How long the SSE responder waits between heartbeat comments to keep proxies / load balancers from closing the idle connection. Default `15_000` ms. | [packages/server/src/sse/events.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L57) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | [packages/server/src/sse/events.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L58) |
| <a id="property-perconnectionqueuelimit"></a> `perConnectionQueueLimit?` | `readonly` | `number` | Cap on the per-connection SSE delivery queue (IP-9). A consumer that stops reading past this many buffered frames is closed instead of growing the queue without bound. Default 1000. | [packages/server/src/sse/events.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/sse/events.ts#L49) |
