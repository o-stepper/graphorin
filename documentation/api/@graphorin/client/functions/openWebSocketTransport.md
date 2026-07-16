[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / openWebSocketTransport

# Function: openWebSocketTransport()

```ts
function openWebSocketTransport(options, listeners): Promise<Transport>;
```

Defined in: [packages/client/src/transport/ws.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/transport/ws.ts#L44)

Open a WebSocket transport. Resolves once the underlying socket
fires `open` (i.e. the upgrade succeeded + the subprotocol matches
`SUBPROTOCOL_NAME`); rejects with a typed
[TransportFailedError](/api/@graphorin/client/errors/classes/TransportFailedError.md) / [SubprotocolMismatchError](/api/@graphorin/client/errors/classes/SubprotocolMismatchError.md) /
[AuthFailedError](/api/@graphorin/client/errors/classes/AuthFailedError.md) otherwise.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TransportOptions`](/api/@graphorin/client/interfaces/TransportOptions.md) |
| `listeners` | [`TransportListeners`](/api/@graphorin/client/interfaces/TransportListeners.md) |

## Returns

`Promise`\&lt;[`Transport`](/api/@graphorin/client/interfaces/Transport.md)\&gt;

## Stable
