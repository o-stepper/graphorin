[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RuleInput

# Interface: RuleInput

Defined in: packages/memory/src/tiers/procedural-memory.ts:11

Author-time rule payload accepted by [ProceduralMemory.define](/api/@graphorin/memory/classes/ProceduralMemory.md#define).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-condition"></a> `condition?` | `readonly` | `string` | Free-form predicate evaluated by [ProceduralMemory.activate](/api/@graphorin/memory/classes/ProceduralMemory.md#activate). The predicate language is intentionally narrow in v0.1: either the literal string `'always'`, or a `'topic=...'` / `'tag=...'` shorthand. Custom predicates should be expressed as a callable matched in `activate(...)`'s `customMatchers` argument. | packages/memory/src/tiers/procedural-memory.ts:20 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | - | packages/memory/src/tiers/procedural-memory.ts:23 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default `'public'` per DEC-126 — rules are NOT user data. | packages/memory/src/tiers/procedural-memory.ts:22 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/memory/src/tiers/procedural-memory.ts:24 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/memory/src/tiers/procedural-memory.ts:12 |
