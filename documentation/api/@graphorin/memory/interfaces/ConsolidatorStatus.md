[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatus

# Interface: ConsolidatorStatus

Defined in: packages/memory/src/consolidator/types.ts:222

Status snapshot returned by [Consolidator.status](/api/@graphorin/memory/interfaces/Consolidator.md#status).

Public shape: `{ tier, queueDepth, dlqSize, lastRuns,
budgetRemaining, deferredRuns }` — extended with a few additional
fields the server health endpoint and the
`graphorin consolidator status` CLI consume.

`queueDepth` is an alias for [pendingConflicts](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-pendingconflicts) (the size
of the deep-phase queue); both fields are populated for backwards
compatibility.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | [`ConsolidatorBudgetSnapshot`](/api/@graphorin/memory/interfaces/ConsolidatorBudgetSnapshot.md) | - | packages/memory/src/consolidator/types.ts:240 |
| <a id="property-budgetremaining"></a> `budgetRemaining` | `readonly` | \{ `costUsd`: `number`; `tokens`: `number`; \} | Spec alias — surfaces remaining-budget figures at the top level. | packages/memory/src/consolidator/types.ts:242 |
| `budgetRemaining.costUsd` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:244 |
| `budgetRemaining.tokens` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:243 |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:238 |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:237 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:239 |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | Phase of the most recent completed run. | packages/memory/src/consolidator/types.ts:231 |
| <a id="property-lastrunat"></a> `lastRunAt?` | `readonly` | `string` | Most recent completed run timestamp (any phase). | packages/memory/src/consolidator/types.ts:229 |
| <a id="property-lastruns"></a> `lastRuns` | `readonly` | [`ConsolidatorLastRuns`](/api/@graphorin/memory/interfaces/ConsolidatorLastRuns.md) | Per-phase last-completed timestamps surfaced for CLI / dashboard. | packages/memory/src/consolidator/types.ts:233 |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | - | packages/memory/src/consolidator/types.ts:227 |
| <a id="property-pendingconflicts"></a> `pendingConflicts` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:236 |
| <a id="property-phases"></a> `phases` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/consolidator/types.ts:225 |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | Spec alias for [pendingConflicts](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-pendingconflicts). | packages/memory/src/consolidator/types.ts:235 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | packages/memory/src/consolidator/types.ts:226 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/consolidator/types.ts:223 |
| <a id="property-triggers"></a> `triggers` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/consolidator/types.ts:224 |
