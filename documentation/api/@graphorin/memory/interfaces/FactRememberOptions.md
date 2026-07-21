[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactRememberOptions

# Interface: FactRememberOptions

Defined in: packages/memory/src/tiers/semantic-memory.ts:372

**`Stable`**

Per-call options accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The
Phase 10b pipeline writes one row to `fact_conflicts` (and
potentially one to `conflict_check_pending`) for every invocation;
pass `pipeline: 'off'` to bypass the pipeline for a single call
(useful for one-shot data imports).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autopromotesynthesized"></a> `autoPromoteSynthesized?` | `readonly` | `boolean` | Auto-promotion policy. When `true`, a *synthesized* write (consolidator extraction) that is **clean** by the injection heuristics is stored `active` instead of quarantined. Injection-flagged writes always stay quarantined - the security gate is preserved. Off by default; the consolidator passes it only when the operator opts in via `autoPromoteExtraction`. No effect on non-synthesized writes. | packages/memory/src/tiers/semantic-memory.ts:394 |
| <a id="property-indextext"></a> `indexText?` | `readonly` | `string` | Precomputed contextual-retrieval index text (advanced). When supplied it overrides the instance's `'late-chunk'` computation: the embedding is computed from - and the FTS row indexed against - this text, while the canonical `text` is stored unchanged. The background consolidator passes this in its `'llm'` mode (the one place an LLM is allowed to write the situating context); first-party callers normally omit it and rely on the offline late-chunk default. | packages/memory/src/tiers/semantic-memory.ts:385 |
| <a id="property-pipeline"></a> `pipeline?` | `readonly` | `"on"` \| `"off"` | - | packages/memory/src/tiers/semantic-memory.ts:373 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal forwarded to the embedder + storage layers. | packages/memory/src/tiers/semantic-memory.ts:375 |
