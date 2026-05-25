[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / openSseTransport

# Function: openSseTransport()

```ts
function openSseTransport(options, listeners): Promise<Transport>;
```

Defined in: packages/client/src/transport/sse.ts:33

Open an SSE transport. Resolves once the underlying `EventSource`
fires `open`; rejects with a typed
[TransportFailedError](/api/@graphorin/client/errors/classes/TransportFailedError.md) on construction failure.

The auth strategy must be `'bearer'` — SSE has no equivalent of the
WebSocket ticket flow because `EventSource` does not allow custom
headers in browsers either. SDK / server-to-server clients should
use the optional `EventSource` injection seam to provide a
polyfill that DOES allow headers (e.g. `eventsource@2.x` on Node).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TransportOptions`](/api/@graphorin/client/interfaces/TransportOptions.md) |
| `listeners` | [`TransportListeners`](/api/@graphorin/client/interfaces/TransportListeners.md) |

## Returns

`Promise`\&lt;[`Transport`](/api/@graphorin/client/interfaces/Transport.md)\&gt;

## Stable
