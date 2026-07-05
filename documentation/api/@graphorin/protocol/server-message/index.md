[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / server-message

# server-message

`ServerMessage` - discriminated union of every frame a Graphorin
server may push to a client. Three families share the channel:

  1. **RPC responses** (`{ jsonrpc, id, result | error }`) -
     correlate with a previously-issued client request.
  2. **Typed push events** (`{ kind: 'event', subject, type,
     payload, eventId }`) - the streaming-first data plane;
     consumers ignore unknown `type` strings per the agent-event
     extensibility convention.
  3. **Asynchronous server frames** (`{ kind: 'lifecycle' | 'error'
     | 'pong' | 'subscribed' | 'unsubscribed' | 'replay-marker' }`)
     - server-initiated messages that do not correlate with a
     single client RPC id.

Every frame carries the `v: '1'` literal so future revisions can
negotiate forward-compatible additions without a subprotocol bump.

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ServerErrorFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerErrorFrame.md) | - |
| [ServerEventFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerEventFrame.md) | Convenience type aliases for callers that want to reference an individual variant without `z.infer<typeof X>`. |
| [ServerLifecycleFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerLifecycleFrame.md) | - |
| [ServerMessage](/api/@graphorin/protocol/server-message/type-aliases/ServerMessage.md) | Inferred TypeScript union for the `ServerMessage` discriminator. |
| [ServerPongFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerPongFrame.md) | - |
| [ServerReplayMarkerFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerReplayMarkerFrame.md) | - |
| [ServerRpcFailure](/api/@graphorin/protocol/server-message/type-aliases/ServerRpcFailure.md) | - |
| [ServerRpcSuccess](/api/@graphorin/protocol/server-message/type-aliases/ServerRpcSuccess.md) | - |
| [ServerSubscribedFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerSubscribedFrame.md) | - |
| [ServerUnsubscribedFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerUnsubscribedFrame.md) | - |

## Variables

| Variable | Description |
| ------ | ------ |
| [RPC\_ERROR\_CODES](/api/@graphorin/protocol/server-message/variables/RPC_ERROR_CODES.md) | Stable JSON-RPC error code catalogue used by the server when surfacing routine failures (per JSON-RPC 2.0 § 5.1 + Graphorin extensions). Application-level errors use codes in the implementation-defined range (`-32000` … `-32099`). |
| [ServerMessageSchema](/api/@graphorin/protocol/server-message/variables/ServerMessageSchema.md) | Zod schema for every legal server → client frame. Validation runs twice in the server pipeline: first when a route handler enqueues the frame onto the dispatcher's send queue (so a malformed frame never escapes the process), then again on the client side to defend against protocol drift. |

## Functions

| Function | Description |
| ------ | ------ |
| [isErrorFrame](/api/@graphorin/protocol/server-message/functions/isErrorFrame.md) | - |
| [isEventFrame](/api/@graphorin/protocol/server-message/functions/isEventFrame.md) | Type guard helpers, one per discriminator. The narrow over the `ServerMessage` union without forcing consumers to memorize the exact field names. |
| [isLifecycleFrame](/api/@graphorin/protocol/server-message/functions/isLifecycleFrame.md) | - |
| [isPongFrame](/api/@graphorin/protocol/server-message/functions/isPongFrame.md) | - |
| [isReplayMarkerFrame](/api/@graphorin/protocol/server-message/functions/isReplayMarkerFrame.md) | - |
| [isRpcFailure](/api/@graphorin/protocol/server-message/functions/isRpcFailure.md) | - |
| [isRpcSuccess](/api/@graphorin/protocol/server-message/functions/isRpcSuccess.md) | - |
| [isSubscribedFrame](/api/@graphorin/protocol/server-message/functions/isSubscribedFrame.md) | - |
| [isUnsubscribedFrame](/api/@graphorin/protocol/server-message/functions/isUnsubscribedFrame.md) | - |
