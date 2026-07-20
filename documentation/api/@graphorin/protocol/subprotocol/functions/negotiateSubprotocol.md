[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / negotiateSubprotocol

# Function: negotiateSubprotocol()

```ts
function negotiateSubprotocol(clientList): string | null;
```

Defined in: src/subprotocol.ts:87

**`Stable`**

Pick the single subprotocol the server should echo back. Returns
`SUBPROTOCOL_NAME` when the client offered it, or `null` when no
compatible variant was advertised. The function ignores `ticket.*`
tokens - those are handled separately via [parseTicketSubprotocol](/api/@graphorin/protocol/subprotocol/functions/parseTicketSubprotocol.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `clientList` | `string` \| readonly `string`[] |

## Returns

`string` \| `null`
