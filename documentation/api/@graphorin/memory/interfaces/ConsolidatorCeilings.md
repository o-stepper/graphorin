[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorCeilings

# Interface: ConsolidatorCeilings

Defined in: packages/memory/src/consolidator/types.ts:61

Hard cost ceilings enforced atomically per UTC day. The default
ceiling shape per tier is captured in
[CONSOLIDATOR\_TIER\_DEFAULTS](/api/@graphorin/memory/variables/CONSOLIDATOR_TIER_DEFAULTS.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cooldownms"></a> `cooldownMs` | `readonly` | `number` | Minimum quiet period between non-manual runs per scope (MCON-8). After each run the runtime persists `nextEligibleAt = now + cooldownMs`; trigger-driven runs (`turn` / `idle` / `cron` / `event` / `budget`) inside that window defer with reason `'cooldown'`. Manual `fireNow(...)` and DLQ replays bypass it. | packages/memory/src/consolidator/types.ts:79 |
| <a id="property-maxconcurrentruns"></a> `maxConcurrentRuns` | `readonly` | `number` | ADVISORY (MCON-8): the per-scope lock serializes runs, so effective concurrency is always 1 per scope regardless of this value. The field is retained for forward compatibility; it enforces nothing today. | packages/memory/src/consolidator/types.ts:70 |
| <a id="property-maxcostperday"></a> `maxCostPerDay` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:63 |
| <a id="property-maxrundurationms"></a> `maxRunDurationMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:71 |
| <a id="property-maxtokensperday"></a> `maxTokensPerDay` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:62 |
