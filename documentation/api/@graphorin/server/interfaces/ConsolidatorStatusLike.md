[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorStatusLike

# Interface: ConsolidatorStatusLike

Defined in: [packages/server/src/consolidator/daemon.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L46)

Subset of `ConsolidatorStatus` the server health endpoint and the
Prometheus metrics consume. The full struct lives in
`@graphorin/memory/consolidator`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | \{ `costRemaining`: `number`; `costUsedToday`: `number`; `resetAt`: `string`; `tokensRemaining`: `number`; `tokensUsedToday`: `number`; \} | [packages/server/src/consolidator/daemon.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L54) |
| `budget.costRemaining` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L58) |
| `budget.costUsedToday` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L56) |
| `budget.resetAt` | `readonly` | `string` | [packages/server/src/consolidator/daemon.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L59) |
| `budget.tokensRemaining` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L57) |
| `budget.tokensUsedToday` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L55) |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L52) |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L51) |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L53) |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | [packages/server/src/consolidator/daemon.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L49) |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L50) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | [packages/server/src/consolidator/daemon.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L48) |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | [packages/server/src/consolidator/daemon.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L47) |
