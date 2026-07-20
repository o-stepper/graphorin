[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorStatusLike

# Interface: ConsolidatorStatusLike

Defined in: packages/server/src/consolidator/daemon.ts:54

**`Stable`**

Subset of `ConsolidatorStatus` the server health endpoint and the
Prometheus metrics consume. The full struct lives in
`@graphorin/memory/consolidator`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | \{ `costRemaining`: `number`; `costUsedToday`: `number`; `resetAt`: `string`; `tokensRemaining`: `number`; `tokensUsedToday`: `number`; \} | packages/server/src/consolidator/daemon.ts:62 |
| `budget.costRemaining` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:66 |
| `budget.costUsedToday` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:64 |
| `budget.resetAt` | `readonly` | `string` | packages/server/src/consolidator/daemon.ts:67 |
| `budget.tokensRemaining` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:65 |
| `budget.tokensUsedToday` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:63 |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:60 |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:59 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:61 |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | packages/server/src/consolidator/daemon.ts:57 |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | packages/server/src/consolidator/daemon.ts:58 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/server/src/consolidator/daemon.ts:56 |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | packages/server/src/consolidator/daemon.ts:55 |
