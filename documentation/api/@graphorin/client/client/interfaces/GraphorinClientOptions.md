[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / GraphorinClientOptions

# Interface: GraphorinClientOptions

Defined in: packages/client/src/graphorin-client.ts:97

Public configuration accepted by [GraphorinClient](/api/@graphorin/client/client/classes/GraphorinClient.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | [`TransportAuth`](/api/@graphorin/client/type-aliases/TransportAuth.md) | - | packages/client/src/graphorin-client.ts:104 |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | Server base URL. Examples: `'wss://graphorin.example.com'` or `'http://localhost:8080'`. The path `/v1/ws` is appended for the WebSocket transport. | packages/client/src/graphorin-client.ts:103 |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Optional client identifier surfaced on diagnostics. | packages/client/src/graphorin-client.ts:123 |
| <a id="property-eventsource"></a> `EventSource?` | `readonly` | \{ (`url`, `eventSourceInitDict?`): `EventSource`; `CLOSED`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `EventSource`; \} | Inject an `EventSource` constructor (Node SDKs / tests). | packages/client/src/graphorin-client.ts:119 |
| `EventSource.CLOSED` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11555 |
| `EventSource.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11553 |
| `EventSource.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11554 |
| `EventSource.prototype` | `public` | `EventSource` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11551 |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Inject a `fetch` implementation (defaults to `globalThis.fetch`). | packages/client/src/graphorin-client.ts:121 |
| <a id="property-reconnect"></a> `reconnect?` | `readonly` | [`BackoffPolicy`](/api/@graphorin/client/reconnect/interfaces/BackoffPolicy.md) | - | packages/client/src/graphorin-client.ts:115 |
| <a id="property-ssesessionpath"></a> `sseSessionPath?` | `readonly` | `string` | SSE path template. The placeholder `:sessionId` is replaced at subscribe time. Default: `'/v1/sessions/:sessionId/events'`. Required when the transport is `'sse'` or when the WS handshake fails on `'auto'`. | packages/client/src/graphorin-client.ts:114 |
| <a id="property-transport"></a> `transport?` | `readonly` | [`TransportPreference`](/api/@graphorin/client/client/type-aliases/TransportPreference.md) | - | packages/client/src/graphorin-client.ts:105 |
| <a id="property-websocket"></a> `WebSocket?` | `readonly` | \{ (`url`, `protocols?`): `WebSocket`; `CLOSED`: `3`; `CLOSING`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `WebSocket`; \} | Inject a `WebSocket` constructor (Node SDKs / tests). | packages/client/src/graphorin-client.ts:117 |
| `WebSocket.CLOSED` | `readonly` | `3` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36131 |
| `WebSocket.CLOSING` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36130 |
| `WebSocket.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36128 |
| `WebSocket.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36129 |
| `WebSocket.prototype` | `public` | `WebSocket` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36126 |
| <a id="property-wspath"></a> `wsPath?` | `readonly` | `string` | Override the WS path (default `'/v1/ws'`). | packages/client/src/graphorin-client.ts:107 |
