[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorCeilings

# Interface: ConsolidatorCeilings

Defined in: packages/memory/src/consolidator/types.ts:58

Hard cost ceilings enforced atomically per UTC day. The default
ceiling shape per tier is captured in
[CONSOLIDATOR\_TIER\_DEFAULTS](/api/@graphorin/memory/variables/CONSOLIDATOR_TIER_DEFAULTS.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cooldownms"></a> `cooldownMs` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:63 |
| <a id="property-maxconcurrentruns"></a> `maxConcurrentRuns` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:61 |
| <a id="property-maxcostperday"></a> `maxCostPerDay` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:60 |
| <a id="property-maxrundurationms"></a> `maxRunDurationMs` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:62 |
| <a id="property-maxtokensperday"></a> `maxTokensPerDay` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:59 |
