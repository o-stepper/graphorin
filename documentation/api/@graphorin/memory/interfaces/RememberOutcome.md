[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RememberOutcome

# Interface: RememberOutcome

Defined in: [packages/memory/src/tiers/semantic-memory.ts:405](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L405)

Returned by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The `fact` is the
stored row (which may be the *existing* fact when the pipeline
dedups). The `decision` mirrors the pipeline outcome so callers can
distinguish silent dedups from active inserts.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md) | - | [packages/memory/src/tiers/semantic-memory.ts:407](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L407) |
| <a id="property-fact"></a> `fact` | `readonly` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) | - | [packages/memory/src/tiers/semantic-memory.ts:406](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L406) |
| <a id="property-quarantinereason"></a> `quarantineReason?` | `readonly` | `"injection"` \| `"synthesized"` | Why this write landed quarantined, if it did (P1-4 / MRET-3). `'injection'` - the offline injection heuristics flagged the text (a memory-poisoning candidate). `'synthesized'` - a consolidator / reflection / induction write awaiting validation. Absent when the fact is `active` or when a dedup returned a pre-existing row. | [packages/memory/src/tiers/semantic-memory.ts:415](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L415) |
