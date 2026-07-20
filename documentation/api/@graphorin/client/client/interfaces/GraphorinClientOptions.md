[**Graphorin API reference v0.13.3**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / GraphorinClientOptions

# Interface: GraphorinClientOptions

Defined in: packages/client/src/graphorin-client.ts:113

**`Stable`**

Public configuration accepted by [GraphorinClient](/api/@graphorin/client/client/classes/GraphorinClient.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-auth"></a> `auth` | `readonly` | [`TransportAuth`](/api/@graphorin/client/type-aliases/TransportAuth.md) | - | packages/client/src/graphorin-client.ts:127 |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | Server base URL. Examples: `'wss://graphorin.example.com'` or `'http://localhost:8080'`. The path `/v1/ws` is appended for the WebSocket transport. | packages/client/src/graphorin-client.ts:126 |
| <a id="property-clientid"></a> `clientId?` | `readonly` | `string` | Optional client identifier surfaced on diagnostics. | packages/client/src/graphorin-client.ts:166 |
| <a id="property-eventsource"></a> `EventSource?` | `readonly` | \{ (`url`, `eventSourceInitDict?`): `EventSource`; `CLOSED`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `EventSource`; \} | Inject an `EventSource` constructor (Node SDKs / tests). | packages/client/src/graphorin-client.ts:162 |
| `EventSource.CLOSED` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11555 |
| `EventSource.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11553 |
| `EventSource.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11554 |
| `EventSource.prototype` | `public` | `EventSource` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:11551 |
| <a id="property-fetch"></a> `fetch?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Inject a `fetch` implementation (defaults to `globalThis.fetch`). | packages/client/src/graphorin-client.ts:164 |
| <a id="property-reconnect"></a> `reconnect?` | `readonly` | [`BackoffPolicy`](/api/@graphorin/client/reconnect/interfaces/BackoffPolicy.md) | - | packages/client/src/graphorin-client.ts:158 |
| <a id="property-rpctimeoutms"></a> `rpcTimeoutMs?` | `readonly` | `number` | Per-RPC reply timeout in milliseconds. When set (and > 0), an RPC that receives no matching reply within this window rejects with a [TransportFailedError](/api/@graphorin/client/errors/classes/TransportFailedError.md) instead of hanging forever on a non-responsive server. Default: unset - no timeout, so a legitimately slow server reply is never aborted (opt-in). | packages/client/src/graphorin-client.ts:174 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Session bound to the SSE fallback: substituted into the `:sessionId` slot of `sseSessionPath`. Required to connect over SSE - the old client sent the literal template and could never receive an event. | packages/client/src/graphorin-client.ts:120 |
| <a id="property-ssesessionpath"></a> `sseSessionPath?` | `readonly` | `string` | SSE path template. The placeholder `:sessionId` is replaced at subscribe time. Default: `'/v1/sessions/:sessionId/events'`. Required when the transport is `'sse'` or when the WS handshake fails on `'auto'`. | packages/client/src/graphorin-client.ts:157 |
| <a id="property-subscriptionqueuelimit"></a> `subscriptionQueueLimit?` | `readonly` | `number` | Per-subscription buffer cap. When the `for await` consumer falls behind and the buffered queue reaches this many frames, the subscription closes with a typed `flow-overflow` error (mirroring the server's queue-overflow close) instead of growing the heap without bound or silently dropping events. Default 10000 (10x the server's default per-connection limit); `0` disables the cap and restores the old unbounded behavior. | packages/client/src/graphorin-client.ts:148 |
| <a id="property-transport"></a> `transport?` | `readonly` | [`TransportPreference`](/api/@graphorin/client/client/type-aliases/TransportPreference.md) | Transport selection. Default `'auto'`: WebSocket first, SSE fallback. Caveat for `'auto'`: SSE carries only the bound session subject, so when a RECONNECT falls back from WS to SSE, live WS subscriptions (agent / workflow subjects) cannot be resumed - they are closed with a `TransportFailedError` (their `for await` consumers reject immediately instead of hanging). Force `'ws'` when your application depends on those subscriptions surviving reconnects. | packages/client/src/graphorin-client.ts:138 |
| <a id="property-websocket"></a> `WebSocket?` | `readonly` | \{ (`url`, `protocols?`): `WebSocket`; `CLOSED`: `3`; `CLOSING`: `2`; `CONNECTING`: `0`; `OPEN`: `1`; `prototype`: `WebSocket`; \} | Inject a `WebSocket` constructor (Node SDKs / tests). | packages/client/src/graphorin-client.ts:160 |
| `WebSocket.CLOSED` | `readonly` | `3` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36131 |
| `WebSocket.CLOSING` | `readonly` | `2` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36130 |
| `WebSocket.CONNECTING` | `readonly` | `0` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36128 |
| `WebSocket.OPEN` | `readonly` | `1` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36129 |
| `WebSocket.prototype` | `public` | `WebSocket` | - | node\_modules/.pnpm/typescript@5.9.3/node\_modules/typescript/lib/lib.dom.d.ts:36126 |
| <a id="property-wspath"></a> `wsPath?` | `readonly` | `string` | Override the WS path (default `'/v1/ws'`). | packages/client/src/graphorin-client.ts:150 |
