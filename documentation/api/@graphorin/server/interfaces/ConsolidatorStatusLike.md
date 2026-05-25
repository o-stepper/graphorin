[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorStatusLike

# Interface: ConsolidatorStatusLike

Defined in: packages/server/src/consolidator/daemon.ts:38

Subset of `ConsolidatorStatus` the server health endpoint and the
Prometheus metrics consume. The full struct lives in
`@graphorin/memory/consolidator`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | \{ `costRemaining`: `number`; `costUsedToday`: `number`; `resetAt`: `string`; `tokensRemaining`: `number`; `tokensUsedToday`: `number`; \} | packages/server/src/consolidator/daemon.ts:46 |
| `budget.costRemaining` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:50 |
| `budget.costUsedToday` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:48 |
| `budget.resetAt` | `readonly` | `string` | packages/server/src/consolidator/daemon.ts:51 |
| `budget.tokensRemaining` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:49 |
| `budget.tokensUsedToday` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:47 |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:44 |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:43 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:45 |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | packages/server/src/consolidator/daemon.ts:41 |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:42 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/server/src/consolidator/daemon.ts:40 |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | packages/server/src/consolidator/daemon.ts:39 |
