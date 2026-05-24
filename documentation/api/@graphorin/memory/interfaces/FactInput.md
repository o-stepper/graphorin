[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / FactInput

# Interface: FactInput

Defined in: packages/memory/src/tiers/semantic-memory.ts:25

Author-time fact payload accepted by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember).
The framework derives `id`, `kind: 'semantic'`, `userId`,
`createdAt`, `updatedAt`, `validFrom`, the optional `embedder_id`,
and the deduplication `hash` from this input.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | packages/memory/src/tiers/semantic-memory.ts:31 |
| <a id="property-object"></a> `object?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:29 |
| <a id="property-predicate"></a> `predicate?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:28 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | packages/memory/src/tiers/semantic-memory.ts:32 |
| <a id="property-subject"></a> `subject?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:27 |
| <a id="property-supersedes"></a> `supersedes?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:35 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/memory/src/tiers/semantic-memory.ts:30 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:26 |
| <a id="property-validfrom"></a> `validFrom?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:33 |
| <a id="property-validto"></a> `validTo?` | `readonly` | `string` | packages/memory/src/tiers/semantic-memory.ts:34 |
