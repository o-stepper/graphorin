[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionCounters

# Interface: RedactionCounters

Defined in: [packages/observability/src/redaction/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L52)

Counter exposed via [createRedactionValidator](/api/@graphorin/observability/functions/createRedactionValidator.md). Implementations
keep counters in-memory; downstream code can scrape them and convert
to Prometheus metrics.

## Stable

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedbyreason"></a> `droppedByReason` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Drops by reason; the four built-in reasons + any custom ones. | [packages/observability/src/redaction/types.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L56) |
| <a id="property-droppedtotal"></a> `droppedTotal` | `number` | Total values dropped by the validator. | [packages/observability/src/redaction/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L54) |
| <a id="property-matchesbypattern"></a> `matchesByPattern` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Pattern-matching counters keyed by pattern name. | [packages/observability/src/redaction/types.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L58) |
