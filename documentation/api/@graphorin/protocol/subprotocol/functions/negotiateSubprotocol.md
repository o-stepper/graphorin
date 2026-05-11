[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / negotiateSubprotocol

# Function: negotiateSubprotocol()

```ts
function negotiateSubprotocol(clientList): string | null;
```

Defined in: subprotocol.ts:87

Pick the single subprotocol the server should echo back. Returns
`SUBPROTOCOL_NAME` when the client offered it, or `null` when no
compatible variant was advertised. The function ignores `ticket.*`
tokens — those are handled separately via [parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `clientList` | `string` \| readonly `string`[] |

## Returns

`string` \| `null`

## Stable
