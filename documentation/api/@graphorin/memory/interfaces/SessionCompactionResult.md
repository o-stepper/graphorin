[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionCompactionResult

# Interface: SessionCompactionResult

Defined in: packages/memory/src/tiers/session-memory.ts:35

Snapshot returned by [SessionMemory.compact](/api/@graphorin/memory/classes/SessionMemory.md#compact). The
minimum-viable rendering simply reports counts; the full
LLM-summarized cutoff (Phase 10c Consolidator) replaces this
implementation later.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-removed"></a> `removed` | `readonly` | `number` | packages/memory/src/tiers/session-memory.ts:36 |
| <a id="property-summarized"></a> `summarized` | `readonly` | `number` | packages/memory/src/tiers/session-memory.ts:37 |
| <a id="property-summary"></a> `summary?` | `readonly` | `string` | packages/memory/src/tiers/session-memory.ts:38 |
