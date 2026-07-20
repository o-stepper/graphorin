[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SseRoutesDeps

# Interface: SseRoutesDeps

Defined in: packages/server/src/sse/events.ts:43

**`Stable`**

Stable shape consumed by [createSseRoutes](/api/@graphorin/server/functions/createSseRoutes.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentary"></a> `commentary?` | `readonly` | [`DeliveryCommentaryConfig`](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md) | - | packages/server/src/sse/events.ts:51 |
| <a id="property-dispatcher"></a> `dispatcher` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | - | packages/server/src/sse/events.ts:50 |
| <a id="property-keepalivems"></a> `keepAliveMs?` | `readonly` | `number` | How long the SSE responder waits between heartbeat comments to keep proxies / load balancers from closing the idle connection. Default `15_000` ms. | packages/server/src/sse/events.ts:57 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/sse/events.ts:58 |
| <a id="property-perconnectionqueuelimit"></a> `perConnectionQueueLimit?` | `readonly` | `number` | Cap on the per-connection SSE delivery queue. A consumer that stops reading past this many buffered frames is closed instead of growing the queue without bound. Default 1000. | packages/server/src/sse/events.ts:49 |
