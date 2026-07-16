[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RuleInput

# Interface: RuleInput

Defined in: [packages/memory/src/tiers/procedural-memory.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L37)

Author-time rule payload accepted by [ProceduralMemory.define](/api/@graphorin/memory/classes/ProceduralMemory.md#define).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-condition"></a> `condition?` | `readonly` | `string` | Free-form predicate evaluated by [ProceduralMemory.activate](/api/@graphorin/memory/classes/ProceduralMemory.md#activate). The predicate language is intentionally narrow in v0.1: either the literal string `'always'`, or a `'topic=...'` / `'tag=...'` shorthand. Custom predicates should be expressed as a callable matched in `activate(...)`'s `customMatchers` argument. | [packages/memory/src/tiers/procedural-memory.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L46) |
| <a id="property-owner"></a> `owner?` | `readonly` | [`MemoryOwner`](/api/@graphorin/core/type-aliases/MemoryOwner.md) | Principal dimension (D3). Absent ⇒ NULL (treated `'user'`). | [packages/memory/src/tiers/procedural-memory.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L62) |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | - | [packages/memory/src/tiers/procedural-memory.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L49) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default `'public'` per DEC-126 - rules are NOT user data. | [packages/memory/src/tiers/procedural-memory.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L48) |
| <a id="property-steps"></a> `steps?` | `readonly` | readonly `string`[] | Optional structured workflow payload (P2-2). Usually set by [ProceduralMemory.induce](/api/@graphorin/memory/classes/ProceduralMemory.md#induce), but accepted here so an author can round-trip a hand-written procedure. See [Rule.steps](/api/@graphorin/core/interfaces/Rule.md#property-steps). | [packages/memory/src/tiers/procedural-memory.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L56) |
| <a id="property-successcriteria"></a> `successCriteria?` | `readonly` | readonly `string`[] | Verifiable success criteria stored with the procedure (P2-2). | [packages/memory/src/tiers/procedural-memory.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L60) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/memory/src/tiers/procedural-memory.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L50) |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | [packages/memory/src/tiers/procedural-memory.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L38) |
| <a id="property-variables"></a> `variables?` | `readonly` | readonly `string`[] | Variable names abstracted into [RuleInput.steps](/api/@graphorin/memory/interfaces/RuleInput.md#property-steps) (P2-2). | [packages/memory/src/tiers/procedural-memory.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/procedural-memory.ts#L58) |
