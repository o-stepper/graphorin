[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / CreateSessionManagerOptions

# Interface: CreateSessionManagerOptions

Defined in: packages/sessions/src/facade.ts:143

Per-session-manager configuration.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentarypolicy"></a> `commentaryPolicy?` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | Default commentary policy. Defaults to `'wrap'`. | packages/sessions/src/facade.ts:149 |
| <a id="property-counters"></a> `counters?` | `readonly` | [`SessionCounters`](/api/@graphorin/sessions/facade/interfaces/SessionCounters.md) | Counter sink (no-op by default). | packages/sessions/src/facade.ts:164 |
| <a id="property-memory"></a> `memory` | `readonly` | [`SessionMemoryFacade`](/api/@graphorin/sessions/facade/interfaces/SessionMemoryFacade.md) | Memory facade - `@graphorin/memory.session` delegate target. | packages/sessions/src/facade.ts:147 |
| <a id="property-newid"></a> `newId?` | `readonly` | (`prefix`) => `string` | Test seam: override the id generator. | packages/sessions/src/facade.ts:168 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Test seam: override `Date.now()`. | packages/sessions/src/facade.ts:166 |
| <a id="property-replay"></a> `replay?` | `readonly` | [`CreateSessionReplayerOptions`](/api/@graphorin/sessions/interfaces/CreateSessionReplayerOptions.md) | Replay engine configuration. | packages/sessions/src/facade.ts:151 |
| <a id="property-replaytracesource"></a> `replayTraceSource?` | `readonly` | (`sessionId`) => \| `AsyncIterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\> \| `Iterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\> \| `undefined` | RP-17: default `traceSource` factory for `Session.replay()`. When a session is replayed without an explicit `traceSource`, this is invoked with the session id to resolve the persisted spans (e.g. `(id) => traceSourceForSession(store.connection, id)` from `@graphorin/store-sqlite`). Without it, replay falls back to the empty source and emits only `replay.start` / `replay.end`. | packages/sessions/src/facade.ts:160 |
| <a id="property-store"></a> `store` | `readonly` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) | Storage adapter - `@graphorin/store-sqlite` is the default. | packages/sessions/src/facade.ts:145 |
