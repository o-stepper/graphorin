[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionCompactionResult

# Interface: SessionCompactionResult

Defined in: packages/memory/src/tiers/session-memory.ts:38

**`Stable`**

Snapshot returned by [SessionMemory.compact](/api/@graphorin/memory/classes/SessionMemory.md#compact). The
minimum-viable rendering simply reports counts; the full
LLM-summarized cutoff (Phase 10c Consolidator) replaces this
implementation later.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-removed"></a> `removed` | `readonly` | `number` | packages/memory/src/tiers/session-memory.ts:39 |
| <a id="property-summarized"></a> `summarized` | `readonly` | `number` | packages/memory/src/tiers/session-memory.ts:40 |
| <a id="property-summary"></a> `summary?` | `readonly` | `string` | packages/memory/src/tiers/session-memory.ts:41 |
