[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactSearchOptions

# Interface: FactSearchOptions

Defined in: packages/memory/src/tiers/semantic-memory.ts:113

Per-call options accepted by [SemanticMemory.search](/api/@graphorin/memory/classes/SemanticMemory.md#search).

## Stable

## Extended by

- [`IterativeSearchOptions`](/api/@graphorin/memory/interfaces/IterativeSearchOptions.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | Point-in-time ("as of") read. When set, only facts whose bi-temporal validity interval contains this instant are returned (`valid_from <= asOf < valid_to`, open-ended bounds allowed), applied at the store layer to both the FTS and vector candidate lists. ISO-8601. Absent ⇒ current behaviour is unchanged. P0-2. **Stable** | packages/memory/src/tiers/semantic-memory.ts:135 |
| <a id="property-candidatetopk"></a> `candidateTopK?` | `readonly` | `number` | Override the per-list candidate count (default `60`). | packages/memory/src/tiers/semantic-memory.ts:117 |
| <a id="property-decay"></a> `decay?` | `readonly` | \{ `now?`: () => `number`; `tauDays`: `number`; \} | Optional decay-aware ranking. When set, the reranker output is post-multiplied by the per-fact retention curve `score *= exp(-elapsedDays / tauDays)` so stale facts drop in the result list without ever being hard-deleted (principle 8). Requires the storage adapter to expose `semantic.listForDecay?(...)` so the search can read `strength` + `lastAccessedAt`; adapters without the surface skip the boost silently. **Stable** | packages/memory/src/tiers/semantic-memory.ts:158 |
| `decay.now?` | `readonly` | () => `number` | Override the wall clock (test seam). | packages/memory/src/tiers/semantic-memory.ts:161 |
| `decay.tauDays` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:159 |
| <a id="property-expandhops"></a> `expandHops?` | `readonly` | `0` \| `1` | One-hop graph expansion (P2-1). With `1` *and* a graph-capable storage adapter (`store.graph`), the facts retrieved by the lexical / vector candidate pass are treated as seeds: facts sharing a canonical entity (subject / object) are fetched via a recursive CTE and fused in as an extra candidate list before rerank — surfacing connected facts the query never matched directly ("what did the person I met in Tbilisi recommend?"). `0` (the default) or a graph-less adapter ⇒ a silent no-op; recall is unchanged. Opt-in + retrieval-heavy. **Stable** | packages/memory/src/tiers/semantic-memory.ts:214 |
| <a id="property-fusion"></a> `fusion?` | `readonly` | [`FusionStrategy`](/api/@graphorin/memory/type-aliases/FusionStrategy.md) | Score-fusion strategy (X-2). Omitted (the default) ⇒ RRF via the configured reranker — behaviour is unchanged. `{ strategy: 'weighted', weights }` fuses through [WeightedRRFReranker](/api/@graphorin/memory/classes/WeightedRRFReranker.md), up-/down-weighting the FTS vs vector candidate lists per [FusionWeights](/api/@graphorin/memory/interfaces/FusionWeights.md); reserve it for callers who have calibrated the weights against labels (the P0-1 eval harness). At equal weights it reproduces RRF. **Stable** | packages/memory/src/tiers/semantic-memory.ts:201 |
| <a id="property-hyde"></a> `hyde?` | `readonly` | `boolean` | HyDE — Hypothetical Document Embeddings (arXiv:2212.10496), P2-3. When `true` *and* both a query transformer and an embedder are configured, generate a short hypothetical answer, embed it, and fuse its vector neighbours into the result. Helps short / ambiguous queries but adds a generate + embed round-trip and can drift — hence opt-in. With no transformer (or no embedder) this is a silent no-op and no provider call is made. **Stable** | packages/memory/src/tiers/semantic-memory.ts:189 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined facts in the result (P1-4). Defaults to `false` — action-driving recall (`fact_search`, auto-recall) never returns quarantined rows. Set `true` only for the validation / inspector path that surfaces quarantined facts to a human for promotion via [SemanticMemory.validate](/api/@graphorin/memory/classes/SemanticMemory.md#validate). **Stable** | packages/memory/src/tiers/semantic-memory.ts:145 |
| <a id="property-multiquery"></a> `multiQuery?` | `readonly` | `number` | Multi-query / RAG-Fusion (P2-3). When set to `N > 1` *and* a query transformer is configured (`createMemory({ queryTransform })`), the query is fanned into up to `N - 1` reworded variants via one cheap LLM call; each variant is retrieved (FTS + vector) and **all** lists are fused through the existing RRF reranker — recovering memories whose stored wording differs from the user's phrasing. `N` bounds the *total* query strings, including the original. Offline (no transformer, or `N <= 1`) this is a **silent no-op**: search stays single-shot and makes no provider call. Opt-in + retrieval-heavy, so reserve it for deliberate recall rather than every search. **Stable** | packages/memory/src/tiers/semantic-memory.ts:177 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/tiers/semantic-memory.ts:115 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Any-of tags filter (MRET-4). A fact matches when it carries at least one of the requested tags; untagged facts never match. Applied in-store on the FTS leg and as a record-level filter on the fused result so every candidate leg (vector / HyDE / graph) obeys it. | packages/memory/src/tiers/semantic-memory.ts:125 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:114 |
