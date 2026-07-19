[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / client

# client

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
| [SubscriptionTarget](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) | Discriminator for the subscription target. Mirrors the strict subject grammar enforced by the server: - `'session'`/`<id>` ⇒ `'session:<id>/events'` - `'agent'`/`<id>` + `runId` ⇒ `'agent:<id>/runs/<runId>/events'` - `'run'`/`<runId>` ⇒ `'session:<sessionId>/runs/<runId>/events'` (when `sessionId` is provided) - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'`, or `'workflow:<id>/runs/<runId>/events'` when the optional `runId` is present (the run-scoped subject advertised by the workflow execute/resume routes) |
| [TransportPreference](/api/@graphorin/client/client/type-aliases/TransportPreference.md) | Transport selector. `'auto'` (default) attempts a WebSocket handshake first and falls back to SSE on failure. |
