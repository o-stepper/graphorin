[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / formatTicketSubprotocol

# Function: formatTicketSubprotocol()

```ts
function formatTicketSubprotocol(ticket): string;
```

Defined in: src/subprotocol.ts:52

**`Stable`**

Format a ticket value as a `Sec-WebSocket-Protocol` token suitable
for browser clients (which cannot attach an `Authorization`
header on the WebSocket upgrade). The companion server helper is
[parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ticket` | `string` |

## Returns

`string`
