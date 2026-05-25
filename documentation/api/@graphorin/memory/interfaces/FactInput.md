[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactInput

# Interface: FactInput

Defined in: packages/memory/src/tiers/semantic-memory.ts:38

Author-time fact payload accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember).
The framework derives `id`, `kind: 'semantic'`, `userId`,
`createdAt`, `updatedAt`, `validFrom`, the optional `embedder_id`,
and the deduplication `hash` from this input.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | - | packages/memory/src/tiers/semantic-memory.ts:44 |
| <a id="property-object"></a> `object?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:42 |
| <a id="property-predicate"></a> `predicate?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:41 |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md) | Trust-provenance tag (P1-4). Writers that synthesize memory pass `'extraction'` / `'reflection'` so the fact lands quarantined; first-party writers pass `'user'` / `'tool'` (or omit it — absent ⇒ treated as first-party `active`). The `status` is *derived* from this tag plus the injection heuristics; it is never author-set. | packages/memory/src/tiers/semantic-memory.ts:56 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/memory/src/tiers/semantic-memory.ts:45 |
| <a id="property-subject"></a> `subject?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:40 |
| <a id="property-supersedes"></a> `supersedes?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:48 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/tiers/semantic-memory.ts:43 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:39 |
| <a id="property-validfrom"></a> `validFrom?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:46 |
| <a id="property-validto"></a> `validTo?` | `readonly` | `string` | - | packages/memory/src/tiers/semantic-memory.ts:47 |
