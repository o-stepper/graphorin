[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / TransportOptions

# Interface: TransportOptions

Defined in: packages/client/src/transport/types.ts:24

Stable shape consumed by every transport implementation.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | [`TransportAuth`](/api/@graphorin/client/type-aliases/TransportAuth.md) | - | packages/client/src/transport/types.ts:26 |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Per-connection identifier surfaced on diagnostics + reconnects. | packages/client/src/transport/types.ts:31 |
| <a id="property-eventsource"></a> `EventSource?` | `readonly` | \{ (`url`, `eventSourceInitDict?`): `EventSource`; `CLOSED`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `EventSource`; \} | - | packages/client/src/transport/types.ts:29 |
| `EventSource.CLOSED` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11555 |
| `EventSource.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11553 |
| `EventSource.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11554 |
| `EventSource.prototype` | `public` | `EventSource` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11551 |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | - | packages/client/src/transport/types.ts:27 |
| <a id="property-lasteventid"></a> `lastEventId?` | `readonly` | `string` | Resume cursor sent as the `Last-Event-ID` header on (re)connect (periphery-03). The server replays only events AFTER it from the buffer - without it every SSE reconnect replays the entire buffered history. Consumed by the SSE transport; ignored by WS (whose resubscribe carries the cursor in the RPC). | packages/client/src/transport/types.ts:39 |
| <a id="property-url"></a> `url` | `readonly` | `string` | - | packages/client/src/transport/types.ts:25 |
| <a id="property-websocket"></a> `WebSocket?` | `readonly` | \{ (`url`, `protocols?`): `WebSocket`; `CLOSED`: `3`; `CLOSING`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `WebSocket`; \} | - | packages/client/src/transport/types.ts:28 |
| `WebSocket.CLOSED` | `readonly` | `3` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36131 |
| `WebSocket.CLOSING` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36130 |
| `WebSocket.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36128 |
| `WebSocket.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36129 |
| `WebSocket.prototype` | `public` | `WebSocket` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36126 |
