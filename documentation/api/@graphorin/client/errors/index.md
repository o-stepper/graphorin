[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / errors

# errors

Typed error hierarchy surfaced by `@graphorin/client`. Every error
class extends the JavaScript built-in `Error` and exposes a stable
`kind` discriminator so consumers can pattern-match without
relying on `instanceof` (which behaves badly across module-system
boundaries when the package is dual-loaded).

## Classes

| Class | Description |
| ------ | ------ |
| [AuthFailedError](/api/@graphorin/client/errors/classes/AuthFailedError.md) | - |
| [ClientAbortedError](/api/@graphorin/client/errors/classes/ClientAbortedError.md) | - |
| [ClientNotConnectedError](/api/@graphorin/client/errors/classes/ClientNotConnectedError.md) | - |
| [GraphorinClientError](/api/@graphorin/client/errors/classes/GraphorinClientError.md) | Base class for every error raised by `@graphorin/client`. Carries a stable [GraphorinClientErrorKind](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) discriminator and an optional `cause` chain. |
| [InvalidServerFrameError](/api/@graphorin/client/errors/classes/InvalidServerFrameError.md) | - |
| [ProtocolViolationError](/api/@graphorin/client/errors/classes/ProtocolViolationError.md) | - |
| [SubprotocolMismatchError](/api/@graphorin/client/errors/classes/SubprotocolMismatchError.md) | - |
| [SubscriptionNotFoundError](/api/@graphorin/client/errors/classes/SubscriptionNotFoundError.md) | - |
| [TransportFailedError](/api/@graphorin/client/errors/classes/TransportFailedError.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [GraphorinClientErrorKind](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md) | Discriminator union of every error kind raised by the client. |

## Functions

| Function | Description |
| ------ | ------ |
| [kindForRpcCode](/api/@graphorin/client/errors/functions/kindForRpcCode.md) | Map a JSON-RPC error code from a server `RpcFailure` frame to the client's discriminated [GraphorinClientErrorKind](/api/@graphorin/client/errors/type-aliases/GraphorinClientErrorKind.md), so a rate-limited or scope-denied RPC is distinguishable from a genuine protocol violation. |
