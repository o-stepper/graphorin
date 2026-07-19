[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InsightSearchOptions

# Interface: InsightSearchOptions

Defined in: packages/memory/src/tiers/insight-memory.ts:23

Per-call options accepted by [InsightMemory.search](/api/@graphorin/memory/classes/InsightMemory.md#search).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined insights. Defaults to `false`. Since reflection-synthesized insights *always* land quarantined, set this `true` to surface them for the validation / inspector path - never for auto-recall fed back into the model. | packages/memory/src/tiers/insight-memory.ts:31 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/tiers/insight-memory.ts:32 |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | - | packages/memory/src/tiers/insight-memory.ts:24 |
