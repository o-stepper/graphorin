[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RememberOutcome

# Interface: RememberOutcome

Defined in: packages/memory/src/tiers/semantic-memory.ts:90

Returned by [SemanticMemory.remember](/api/@graphorin/memory/classes/SemanticMemory.md#remember). The `fact` is the
stored row (which may be the *existing* fact when the pipeline
dedups). The `decision` mirrors the pipeline outcome so callers can
distinguish silent dedups from active inserts.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-decision"></a> `decision` | `readonly` | [`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md) | packages/memory/src/tiers/semantic-memory.ts:92 |
| <a id="property-fact"></a> `fact` | `readonly` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) | packages/memory/src/tiers/semantic-memory.ts:91 |
