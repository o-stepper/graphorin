[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorLastRuns

# Interface: ConsolidatorLastRuns

Defined in: [packages/memory/src/consolidator/types.ts:257](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L257)

Per-phase last-run snapshot surfaced inside
[ConsolidatorStatus.lastRuns](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-lastruns). Each entry carries the
timestamp of the most recent **completed** invocation for that
phase (`undefined` when the phase has never run).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-deep"></a> `deep?` | `readonly` | `string` | [packages/memory/src/consolidator/types.ts:260](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L260) |
| <a id="property-light"></a> `light?` | `readonly` | `string` | [packages/memory/src/consolidator/types.ts:258](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L258) |
| <a id="property-standard"></a> `standard?` | `readonly` | `string` | [packages/memory/src/consolidator/types.ts:259](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L259) |
