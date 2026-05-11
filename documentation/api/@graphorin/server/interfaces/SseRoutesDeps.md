[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SseRoutesDeps

# Interface: SseRoutesDeps

Defined in: packages/server/src/sse/events.ts:43

Stable shape consumed by [createSseRoutes](/api/@graphorin/server/functions/createSseRoutes.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentary"></a> `commentary?` | `readonly` | [`DeliveryCommentaryConfig`](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md) | - | packages/server/src/sse/events.ts:45 |
| <a id="property-dispatcher"></a> `dispatcher` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | - | packages/server/src/sse/events.ts:44 |
| <a id="property-keepalivems"></a> `keepAliveMs?` | `readonly` | `number` | How long the SSE responder waits between heartbeat comments to keep proxies / load balancers from closing the idle connection. Default `15_000` ms. | packages/server/src/sse/events.ts:51 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | packages/server/src/sse/events.ts:52 |
