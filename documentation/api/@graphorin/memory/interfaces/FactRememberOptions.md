[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactRememberOptions

# Interface: FactRememberOptions

Defined in: packages/memory/src/tiers/semantic-memory.ts:240

Per-call options accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The
Phase 10b pipeline writes one row to `fact_conflicts` (and
potentially one to `conflict_check_pending`) for every invocation;
pass `pipeline: 'off'` to bypass the pipeline for a single call
(useful for one-shot data imports).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-indextext"></a> `indexText?` | `readonly` | `string` | Precomputed contextual-retrieval index text (P1-3, advanced). When supplied it overrides the instance's `'late-chunk'` computation: the embedding is computed from — and the FTS row indexed against — this text, while the canonical `text` is stored unchanged. The background consolidator passes this in its `'llm'` mode (the one place an LLM is allowed to write the situating context); first-party callers normally omit it and rely on the offline late-chunk default. | packages/memory/src/tiers/semantic-memory.ts:253 |
| <a id="property-pipeline"></a> `pipeline?` | `readonly` | `"on"` \| `"off"` | - | packages/memory/src/tiers/semantic-memory.ts:241 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal forwarded to the embedder + storage layers. | packages/memory/src/tiers/semantic-memory.ts:243 |
