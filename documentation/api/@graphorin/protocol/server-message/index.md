[**Graphorin API reference v0.13.0**](../../../index.md)

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

Versioning contract: the frame ENVELOPE -
the set of `kind`s, the fields of the control frames, and the
`v: '1'` literal - is validated strictly (`.strict()`, literal `v`)
on BOTH server and client, and evolves only in lockstep with both
sides shipping together: there is NO negotiation, and a frame with
`v: '2'` is rejected outright. That is the deployment model of the
0.x line. The additive extension points are deliberate and inside
the envelope: the `type` string + `payload: z.unknown()` of event
frames (consumers ignore unknown `type`s per the agent-event
convention), `result: z.unknown()` of RPC responses, and the
`capabilities` record of the `initialize` result (which today the
shipped client does not consume). If additive envelope evolution is
ever promised publicly, that is a separate negotiation feature -
do not loosen `.strict()` for it piecemeal.

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
