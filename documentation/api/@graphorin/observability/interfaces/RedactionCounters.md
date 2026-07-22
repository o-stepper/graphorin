[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionCounters

# Interface: RedactionCounters

Defined in: packages/observability/src/redaction/types.ts:52

**`Stable`**

Counter exposed via [createRedactionValidator](/api/@graphorin/observability/functions/createRedactionValidator.md). Implementations
keep counters in-memory; downstream code can scrape them and convert
to Prometheus metrics.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedbyreason"></a> `droppedByReason` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Drops by reason; the four built-in reasons + any custom ones. | packages/observability/src/redaction/types.ts:56 |
| <a id="property-droppedtotal"></a> `droppedTotal` | `number` | Total values dropped by the validator. | packages/observability/src/redaction/types.ts:54 |
| <a id="property-matchesbypattern"></a> `matchesByPattern` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Pattern-matching counters keyed by pattern name. | packages/observability/src/redaction/types.ts:58 |
