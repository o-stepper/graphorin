[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactInput

# Interface: FactInput

Defined in: packages/memory/src/tiers/semantic-memory.ts:43

Author-time fact payload accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember).
The framework derives `id`, `kind: 'semantic'`, `userId`,
`createdAt`, `updatedAt`, `validFrom`, the optional `embedder_id`,
and the deduplication `hash` from this input.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:49 |
| <a id="property-importance"></a> `importance?` | `readonly` | `number` | Importance hint in `[0, 1]` (X-1 / MCON-12). Feeds the multi-signal salience score that orders decay archiving and capacity eviction - higher importance ⇒ evicted later. Values are clamped to `[0, 1]`; non-finite values are dropped. The consolidator's extraction pass fills this from the model's per-fact 1-10 rating (`normalizeImportance`); absent ⇒ the neutral midpoint at scoring time. | packages/memory/src/tiers/semantic-memory.ts:71 |
| <a id="property-object"></a> `object?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:47 |
| <a id="property-owner"></a> `owner?` | `readonly` | [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) | Principal dimension (D3). The consolidator stamps `'agent'` on synthesized writes; user-authored writes may pass `'user'`. Absent (the default) leaves the column NULL - treated as `'user'` at filter time. Never gates default recall. | packages/memory/src/tiers/semantic-memory.ts:78 |
| <a id="property-predicate"></a> `predicate?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:46 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). Writers that synthesize memory pass `'extraction'` / `'reflection'` so the fact lands quarantined; first-party writers pass `'user'` / `'tool'` (or omit it - absent ⇒ treated as first-party `active`). The `status` is *derived* from this tag plus the injection heuristics; it is never author-set. | packages/memory/src/tiers/semantic-memory.ts:61 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/memory/src/tiers/semantic-memory.ts:50 |
| <a id="property-subject"></a> `subject?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:45 |
| <a id="property-supersedes"></a> `supersedes?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:53 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/tiers/semantic-memory.ts:48 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:44 |
| <a id="property-validfrom"></a> `validFrom?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:51 |
| <a id="property-validto"></a> `validTo?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:52 |
