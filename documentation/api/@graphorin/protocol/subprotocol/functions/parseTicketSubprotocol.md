[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / parseTicketSubprotocol

# Function: parseTicketSubprotocol()

```ts
function parseTicketSubprotocol(clientList): string | undefined;
```

Defined in: subprotocol.ts:67

Extract the ticket value from a single comma-separated client list
(e.g. `'graphorin.protocol.v1, ticket.abc-123'`). Returns
`undefined` if no `ticket.*` token is present. Whitespace around
each comma-separated token is ignored.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `clientList` | `string` \| readonly `string`[] |

## Returns

`string` \| `undefined`

## Stable
