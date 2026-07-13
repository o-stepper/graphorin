[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorStatus

# Interface: ConsolidatorStatus

Defined in: [packages/memory/src/consolidator/types.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L361)

Status snapshot returned by [Consolidator.status](/api/@graphorin/memory/interfaces/Consolidator.md#status).

Public shape: `{ tier, queueDepth, dlqSize, lastRuns,
budgetRemaining, deferredRuns }` - extended with a few additional
fields the server health endpoint and the
`graphorin consolidator status` CLI consume.

`queueDepth` is an alias for [pendingConflicts](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-pendingconflicts) (the size
of the deep-phase queue); both fields are populated for backwards
compatibility.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | [`ConsolidatorBudgetSnapshot`](/api/@graphorin/memory/interfaces/ConsolidatorBudgetSnapshot.md) | - | [packages/memory/src/consolidator/types.ts:379](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L379) |
| <a id="property-budgetremaining"></a> `budgetRemaining` | `readonly` | \{ `costUsd`: `number`; `tokens`: `number`; \} | Spec alias - surfaces remaining-budget figures at the top level. | [packages/memory/src/consolidator/types.ts:381](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L381) |
| `budgetRemaining.costUsd` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:383](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L383) |
| `budgetRemaining.tokens` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:382](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L382) |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:377](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L377) |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:376](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L376) |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:378](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L378) |
| <a id="property-lastphase"></a> `lastPhase?` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | Phase of the most recent completed run. | [packages/memory/src/consolidator/types.ts:370](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L370) |
| <a id="property-lastrunat"></a> `lastRunAt?` | `readonly` | `string` | Most recent completed run timestamp (any phase). | [packages/memory/src/consolidator/types.ts:368](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L368) |
| <a id="property-lastruns"></a> `lastRuns` | `readonly` | [`ConsolidatorLastRuns`](/api/@graphorin/memory/interfaces/ConsolidatorLastRuns.md) | Per-phase last-completed timestamps surfaced for CLI / dashboard. | [packages/memory/src/consolidator/types.ts:372](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L372) |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | - | [packages/memory/src/consolidator/types.ts:366](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L366) |
| <a id="property-pendingconflicts"></a> `pendingConflicts` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L375) |
| <a id="property-phases"></a> `phases` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | [packages/memory/src/consolidator/types.ts:364](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L364) |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | Spec alias for [pendingConflicts](/api/@graphorin/memory/interfaces/ConsolidatorStatus.md#property-pendingconflicts). | [packages/memory/src/consolidator/types.ts:374](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L374) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | [packages/memory/src/consolidator/types.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L365) |
| <a id="property-tier"></a> `tier` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | [packages/memory/src/consolidator/types.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L362) |
| <a id="property-triggers"></a> `triggers` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | [packages/memory/src/consolidator/types.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L363) |
