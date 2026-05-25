[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / CreateSessionManagerOptions

# Interface: CreateSessionManagerOptions

Defined in: packages/sessions/src/facade.ts:119

Per-session-manager configuration.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-commentarypolicy"></a> `commentaryPolicy?` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | Default commentary policy. Defaults to `'wrap'`. | packages/sessions/src/facade.ts:125 |
| <a id="property-counters"></a> `counters?` | `readonly` | [`SessionCounters`](/api/@graphorin/sessions/facade/interfaces/SessionCounters.md) | Counter sink (no-op by default). | packages/sessions/src/facade.ts:129 |
| <a id="property-memory"></a> `memory` | `readonly` | [`SessionMemoryFacade`](/api/@graphorin/sessions/facade/interfaces/SessionMemoryFacade.md) | Memory facade — `@graphorin/memory.session` delegate target. | packages/sessions/src/facade.ts:123 |
| <a id="property-newid"></a> `newId?` | `readonly` | (`prefix`) => `string` | Test seam: override the id generator. | packages/sessions/src/facade.ts:133 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Test seam: override `Date.now()`. | packages/sessions/src/facade.ts:131 |
| <a id="property-replay"></a> `replay?` | `readonly` | [`CreateSessionReplayerOptions`](/api/@graphorin/sessions/interfaces/CreateSessionReplayerOptions.md) | Replay engine configuration. | packages/sessions/src/facade.ts:127 |
| <a id="property-store"></a> `store` | `readonly` | [`SessionStoreExt`](/api/@graphorin/core/interfaces/SessionStoreExt.md) | Storage adapter — `@graphorin/store-sqlite` is the default. | packages/sessions/src/facade.ts:121 |
