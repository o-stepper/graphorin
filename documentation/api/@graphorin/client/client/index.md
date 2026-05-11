[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / client

# client

`GraphorinClient` — ergonomic façade over the
[Transport](/api/@graphorin/client/interfaces/Transport.md) contract. Handles:

  - WS handshake (`openWebSocketTransport`) with optional ticket flow.
  - Optional SSE fallback (`openSseTransport`) for environments
    that block WebSocket upgrades.
  - JSON-RPC request / response correlation for `subscribe` /
    `unsubscribe` / `cancel` / `resume` / `ping` calls.
  - Async-iterable subscriptions (`for await (const event of
    sub.events())`).
  - Exponential-backoff reconnect with `lastEventId` resume against
    the server replay buffer.

The class is intentionally small (≈ 400 LOC) so the production
cross-cuts (telemetry, sticky reconnect on transient errors,
load-shedding) live in higher-level wrappers consumers build on
top of `GraphorinClient` instead of leaking into the protocol
adapter itself.

## Classes

| Class | Description |
| ------ | ------ |
| [GraphorinClient](/api/@graphorin/client/client/classes/GraphorinClient.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [GraphorinClientOptions](/api/@graphorin/client/client/interfaces/GraphorinClientOptions.md) | Public configuration accepted by [GraphorinClient](/api/@graphorin/client/client/classes/GraphorinClient.md). |
| [Subscription](/api/@graphorin/client/client/interfaces/Subscription.md) | Public surface returned by [GraphorinClient.subscribe](/api/@graphorin/client/client/classes/GraphorinClient.md#subscribe). |
| [SubscriptionMetadata](/api/@graphorin/client/client/interfaces/SubscriptionMetadata.md) | Snapshot returned by [Subscription.metadata](/api/@graphorin/client/client/interfaces/Subscription.md#metadata). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [SubscriptionTarget](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) | Discriminator for the subscription target. Mirrors the strict subject grammar enforced by the server: - `'session'`/`<id>` ⇒ `'session:<id>/events'` - `'agent'`/`<id>` + `runId` ⇒ `'agent:<id>/runs/<runId>/events'` - `'run'`/`<runId>` ⇒ `'session:<sessionId>/runs/<runId>/events'` (when `sessionId` is provided) - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'` |
| [TransportPreference](/api/@graphorin/client/client/type-aliases/TransportPreference.md) | Transport selector. `'auto'` (default) attempts a WebSocket handshake first and falls back to SSE on failure. |
