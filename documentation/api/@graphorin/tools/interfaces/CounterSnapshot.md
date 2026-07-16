[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / CounterSnapshot

# Interface: CounterSnapshot

Defined in: [packages/tools/src/audit/counters.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/counters.ts#L111)

Snapshot of the counter + histogram registry. Returns fresh frozen
objects so callers cannot accidentally mutate the registry.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-counters"></a> `counters` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | - | [packages/tools/src/audit/counters.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/counters.ts#L112) |
| <a id="property-histograms"></a> `histograms` | `readonly` | `Readonly`\<`Record`\<`string`, `ReadonlyArray`\&lt;`number`\&gt;\>\> | - | [packages/tools/src/audit/counters.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/counters.ts#L113) |
| <a id="property-kinds"></a> `kinds` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `"counter"` \| `"gauge"`\&gt;\> | W-051: per-key instrument kind - `'counter'` (monotonic; bridge with a delta-inc) vs `'gauge'` (absolute; bridge with a set). Keys mirror `counters`. | [packages/tools/src/audit/counters.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/counters.ts#L119) |
