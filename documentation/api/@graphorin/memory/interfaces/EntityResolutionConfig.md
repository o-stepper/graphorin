[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityResolutionConfig

# Interface: EntityResolutionConfig

Defined in: packages/memory/src/graph/entity-resolver.ts:170

Tunable thresholds + LLM-adjudication switch for [EntityResolver](/api/@graphorin/memory/classes/EntityResolver.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-adjudicatethreshold"></a> `adjudicateThreshold?` | `readonly` | `number` | Cosine in `[this, merge)` is ambiguous. Default [DEFAULT\_ADJUDICATE\_THRESHOLD](/api/@graphorin/memory/variables/DEFAULT_ADJUDICATE_THRESHOLD.md). | packages/memory/src/graph/entity-resolver.ts:174 |
| <a id="property-llmadjudication"></a> `llmAdjudication?` | `readonly` | `boolean` | Resolve the ambiguous band with one provider call. Requires a `provider`. Default `false` ⇒ ambiguous mints a new entity (no network call; never auto-merges on weak evidence). | packages/memory/src/graph/entity-resolver.ts:180 |
| <a id="property-mergethreshold"></a> `mergeThreshold?` | `readonly` | `number` | Cosine `≥` this auto-reuses a match. Default [DEFAULT\_MERGE\_THRESHOLD](/api/@graphorin/memory/variables/DEFAULT_MERGE_THRESHOLD.md). | packages/memory/src/graph/entity-resolver.ts:172 |
