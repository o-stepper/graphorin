[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactSearchOptions

# Interface: FactSearchOptions

Defined in: packages/memory/src/tiers/semantic-memory.ts:43

Per-call options accepted by [SemanticMemory.search](/api/@graphorin/memory/classes/SemanticMemory.md#search).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-candidatetopk"></a> `candidateTopK?` | `readonly` | `number` | Override the per-list candidate count (default `60`). | packages/memory/src/tiers/semantic-memory.ts:47 |
| <a id="property-decay"></a> `decay?` | `readonly` | \{ `now?`: () => `number`; `tauDays`: `number`; \} | Optional decay-aware ranking. When set, the reranker output is post-multiplied by the per-fact retention curve `score *= exp(-elapsedDays / tauDays)` so stale facts drop in the result list without ever being hard-deleted (principle 8). Requires the storage adapter to expose `semantic.listForDecay?(...)` so the search can read `strength` + `lastAccessedAt`; adapters without the surface skip the boost silently. **Stable** | packages/memory/src/tiers/semantic-memory.ts:60 |
| `decay.now?` | `readonly` | () => `number` | Override the wall clock (test seam). | packages/memory/src/tiers/semantic-memory.ts:63 |
| `decay.tauDays` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:61 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/tiers/semantic-memory.ts:45 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:44 |
