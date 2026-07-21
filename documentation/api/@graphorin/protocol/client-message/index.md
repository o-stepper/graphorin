[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / client-message

# client-message

`ClientMessage` - discriminated union of every frame a Graphorin
WebSocket client may send to the server. The wire is hybrid: the
control plane uses JSON-RPC-shaped requests / notifications; the
data plane uses typed push events emitted exclusively by the server
(see `./server-message.ts`).

Every frame carries the `v: '1'` literal so future revisions can
negotiate forward-compatible additions without a subprotocol bump.
The matching subprotocol identifier is `graphorin.protocol.v1`
(see `./subprotocol.ts`).

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ClientMessage](/api/@graphorin/protocol/client-message/type-aliases/ClientMessage.md) | Inferred TypeScript union for the `ClientMessage` discriminator. A value satisfying this type round-trips through [ClientMessageSchema](/api/@graphorin/protocol/client-message/variables/ClientMessageSchema.md) without throwing. |
| [ClientMessageId](/api/@graphorin/protocol/client-message/type-aliases/ClientMessageId.md) | Convenience type for the JSON-RPC `id` slot. Matches the Graphorin subset (string + integer; no `null`, no float). |

## Variables

| Variable | Description |
| ------ | ------ |
| [ClientMessageSchema](/api/@graphorin/protocol/client-message/variables/ClientMessageSchema.md) | Zod schema for every legal client → server frame. Use [ClientMessageSchema](/api/@graphorin/protocol/client-message/variables/ClientMessageSchema.md).safeParse() inside the server upgrade handler before dispatching to the corresponding subscription / cancel / ping handler. |
| [RpcId](/api/@graphorin/protocol/client-message/variables/RpcId.md) | Zod schema for RPC correlation ids (non-empty string or integer). |

## Functions

| Function | Description |
| ------ | ------ |
| [isCancelledNotification](/api/@graphorin/protocol/client-message/functions/isCancelledNotification.md) | - |
| [isInitializeRequest](/api/@graphorin/protocol/client-message/functions/isInitializeRequest.md) | Type guard helpers - one per `method` literal - so consumers can narrow the `ClientMessage` union without re-stringifying the discriminator. |
| [isPingRequest](/api/@graphorin/protocol/client-message/functions/isPingRequest.md) | - |
| [isRunCancelRequest](/api/@graphorin/protocol/client-message/functions/isRunCancelRequest.md) | - |
| [isSubscribeRequest](/api/@graphorin/protocol/client-message/functions/isSubscribeRequest.md) | - |
| [isUnsubscribeRequest](/api/@graphorin/protocol/client-message/functions/isUnsubscribeRequest.md) | - |
