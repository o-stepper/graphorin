[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RememberOutcome

# Interface: RememberOutcome

Defined in: packages/memory/src/tiers/semantic-memory.ts:405

**`Stable`**

Returned by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The `fact` is the
stored row (which may be the *existing* fact when the pipeline
dedups). The `decision` mirrors the pipeline outcome so callers can
distinguish silent dedups from active inserts.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md) | - | packages/memory/src/tiers/semantic-memory.ts:407 |
| <a id="property-fact"></a> `fact` | `readonly` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) | - | packages/memory/src/tiers/semantic-memory.ts:406 |
| <a id="property-quarantinereason"></a> `quarantineReason?` | `readonly` | `"injection"` \| `"synthesized"` | Why this write landed quarantined, if it did. `'injection'` - the offline injection heuristics flagged the text (a memory-poisoning candidate). `'synthesized'` - a consolidator / reflection / induction write awaiting validation. Absent when the fact is `active` or when a dedup returned a pre-existing row. | packages/memory/src/tiers/semantic-memory.ts:415 |
