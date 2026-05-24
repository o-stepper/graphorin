[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactRememberOptions

# Interface: FactRememberOptions

Defined in: packages/memory/src/tiers/semantic-memory.ts:76

Per-call options accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The
Phase 10b pipeline writes one row to `fact_conflicts` (and
potentially one to `conflict_check_pending`) for every invocation;
pass `pipeline: 'off'` to bypass the pipeline for a single call
(useful for one-shot data imports).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-pipeline"></a> `pipeline?` | `readonly` | `"on"` \| `"off"` | - | packages/memory/src/tiers/semantic-memory.ts:77 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal forwarded to the embedder + storage layers. | packages/memory/src/tiers/semantic-memory.ts:79 |
