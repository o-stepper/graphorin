[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorCeilings

# Interface: ConsolidatorCeilings

Defined in: packages/memory/src/consolidator/types.ts:104

**`Stable`**

Daily cost ceilings, tracked per budget window. How a breach is
handled depends on [OnBudgetExceed](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md): `'pause'` / `'throw'`
enforce, `'log'` (the shipped standard/full presets) only WARNs and
keeps running. The USD leg accumulates only when a `priceUsage`
pricer is configured - without one every
call prices at $0 and `maxCostPerDay` can never trip. The default
ceiling shape per tier is captured in
[CONSOLIDATOR\_TIER\_DEFAULTS](/api/@graphorin/memory/variables/CONSOLIDATOR_TIER_DEFAULTS.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cooldownms"></a> `cooldownMs` | `readonly` | `number` | Minimum quiet period between non-manual runs per scope. After each run the runtime persists `nextEligibleAt = now + cooldownMs`; trigger-driven runs (`turn` / `idle` / `cron` / `event` / `budget`) inside that window defer with reason `'cooldown'`. Manual `fireNow(...)` and DLQ replays bypass it. | packages/memory/src/consolidator/types.ts:122 |
| <a id="property-maxconcurrentruns"></a> `maxConcurrentRuns` | `readonly` | `number` | ADVISORY: the per-scope lock serializes runs, so effective concurrency is always 1 per scope regardless of this value. The field is retained for forward compatibility; it enforces nothing today. | packages/memory/src/consolidator/types.ts:113 |
| <a id="property-maxcostperday"></a> `maxCostPerDay` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:106 |
| <a id="property-maxrundurationms"></a> `maxRunDurationMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:114 |
| <a id="property-maxtokensperday"></a> `maxTokensPerDay` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:105 |
