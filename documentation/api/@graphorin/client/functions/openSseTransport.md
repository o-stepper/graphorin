[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [](/api/@graphorin/client/README.md) / openSseTransport

# Function: openSseTransport()

```ts
function openSseTransport(options, listeners): Promise<Transport>;
```

Defined in: packages/client/src/transport/sse.ts:31

**`Stable`**

Open an SSE transport. Resolves once the server answers with a
streaming response; rejects with a typed
[TransportFailedError](/api/@graphorin/client/errors/classes/TransportFailedError.md) on construction / connection failure.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TransportOptions`](/api/@graphorin/client/interfaces/TransportOptions.md) |
| `listeners` | [`TransportListeners`](/api/@graphorin/client/interfaces/TransportListeners.md) |

## Returns

`Promise`\&lt;[`Transport`](/api/@graphorin/client/interfaces/Transport.md)\&gt;
