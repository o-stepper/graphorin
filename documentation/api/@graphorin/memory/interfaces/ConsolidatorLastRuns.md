[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorLastRuns

# Interface: ConsolidatorLastRuns

Defined in: packages/memory/src/consolidator/types.ts:186

Per-phase last-run snapshot surfaced inside
[ConsolidatorStatus.lastRuns](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-lastruns). Each entry carries the
timestamp of the most recent **completed** invocation for that
phase (`undefined` when the phase has never run).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-deep"></a> `deep?` | `readonly` | `string` | packages/memory/src/consolidator/types.ts:189 |
| <a id="property-light"></a> `light?` | `readonly` | `string` | packages/memory/src/consolidator/types.ts:187 |
| <a id="property-standard"></a> `standard?` | `readonly` | `string` | packages/memory/src/consolidator/types.ts:188 |
