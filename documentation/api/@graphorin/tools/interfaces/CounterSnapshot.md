[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / CounterSnapshot

# Interface: CounterSnapshot

Defined in: packages/tools/src/audit/counters.ts:101

Snapshot of the counter + histogram registry. Returns fresh frozen
objects so callers cannot accidentally mutate the registry.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-counters"></a> `counters` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | packages/tools/src/audit/counters.ts:102 |
| <a id="property-histograms"></a> `histograms` | `readonly` | `Readonly`\<`Record`\<`string`, `ReadonlyArray`\&lt;`number`\&gt;\>\> | packages/tools/src/audit/counters.ts:103 |
