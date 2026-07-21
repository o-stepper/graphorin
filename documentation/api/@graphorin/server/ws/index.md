[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / ws

# ws

`@graphorin/server/ws` - WebSocket protocol implementation for
the Graphorin standalone server. Combines the dispatcher (which
fans events out to subscribers + applies the delivery-layer
commentary sanitization), the in-memory ticket store (browser
single-use ticket flow), the per-subject replay buffer, the strict
subject grammar parser + scope check, and the `@hono/node-ws`
upgrade handler.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ReplayBufferStats](/api/@graphorin/server/ws/interfaces/ReplayBufferStats.md) | Occupancy snapshot returned by [ReplayBuffer.stats](/api/@graphorin/server/interfaces/ReplayBuffer.md#stats). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ParseSubjectResult](/api/@graphorin/server/ws/type-aliases/ParseSubjectResult.md) | Result of [tryParseSubject](/api/@graphorin/server/functions/tryParseSubject.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [isSubjectAllowed](/api/@graphorin/server/ws/functions/isSubjectAllowed.md) | Compatibility shim - re-exports `scopeMatches` so consumers don't have to learn the security package's surface. |
| [scheduleReplayBufferPruning](/api/@graphorin/server/ws/functions/scheduleReplayBufferPruning.md) | Schedule a periodic [ReplayBuffer.prune](/api/@graphorin/server/interfaces/ReplayBuffer.md#prune) sweep. Without it TTL expiry only ran lazily inside `push`/`replay`/`size` FOR THE SAME SUBJECT, so every finished run-subject (a fresh runId per run) retained up to `maxEvents` full payloads forever on a long-living server. Mirrors `scheduleRunPruning`: `unref`-ed timer, returns a stop function. The sweep applies only the already documented TTL - replay semantics inside the TTL window are unchanged (an immediate `forget` on run completion would break short-disconnect resume of terminal events). |

## References

### BareEventFrame

Re-exports [BareEventFrame](/api/@graphorin/server/interfaces/BareEventFrame.md)

***

### createReplayBuffer

Re-exports [createReplayBuffer](/api/@graphorin/server/functions/createReplayBuffer.md)

***

### createWsDispatcher

Re-exports [createWsDispatcher](/api/@graphorin/server/functions/createWsDispatcher.md)

***

### createWsTicketStore

Re-exports [createWsTicketStore](/api/@graphorin/server/functions/createWsTicketStore.md)

***

### createWsUpgradeEvents

Re-exports [createWsUpgradeEvents](/api/@graphorin/server/functions/createWsUpgradeEvents.md)

***

### ParsedSubject

Re-exports [ParsedSubject](/api/@graphorin/server/type-aliases/ParsedSubject.md)

***

### ReplayBuffer

Re-exports [ReplayBuffer](/api/@graphorin/server/interfaces/ReplayBuffer.md)

***

### ReplayBufferOptions

Re-exports [ReplayBufferOptions](/api/@graphorin/server/interfaces/ReplayBufferOptions.md)

***

### ReplayBufferSlice

Re-exports [ReplayBufferSlice](/api/@graphorin/server/interfaces/ReplayBufferSlice.md)

***

### requiredScopeFor

Re-exports [requiredScopeFor](/api/@graphorin/server/functions/requiredScopeFor.md)

***

### SubscribeResult

Re-exports [SubscribeResult](/api/@graphorin/server/type-aliases/SubscribeResult.md)

***

### tryParseSubject

Re-exports [tryParseSubject](/api/@graphorin/server/functions/tryParseSubject.md)

***

### WsDispatcher

Re-exports [WsDispatcher](/api/@graphorin/server/interfaces/WsDispatcher.md)

***

### WsDispatcherOptions

Re-exports [WsDispatcherOptions](/api/@graphorin/server/interfaces/WsDispatcherOptions.md)

***

### WsDispatcherWarning

Re-exports [WsDispatcherWarning](/api/@graphorin/server/type-aliases/WsDispatcherWarning.md)

***

### WsSubscriberHandle

Re-exports [WsSubscriberHandle](/api/@graphorin/server/interfaces/WsSubscriberHandle.md)

***

### WsSubscriptionSnapshot

Re-exports [WsSubscriptionSnapshot](/api/@graphorin/server/interfaces/WsSubscriptionSnapshot.md)

***

### WsTicket

Re-exports [WsTicket](/api/@graphorin/server/interfaces/WsTicket.md)

***

### WsTicketConsumeResult

Re-exports [WsTicketConsumeResult](/api/@graphorin/server/type-aliases/WsTicketConsumeResult.md)

***

### WsTicketStore

Re-exports [WsTicketStore](/api/@graphorin/server/interfaces/WsTicketStore.md)

***

### WsTicketStoreOptions

Re-exports [WsTicketStoreOptions](/api/@graphorin/server/interfaces/WsTicketStoreOptions.md)

***

### WsUpgradeOptions

Re-exports [WsUpgradeOptions](/api/@graphorin/server/interfaces/WsUpgradeOptions.md)
