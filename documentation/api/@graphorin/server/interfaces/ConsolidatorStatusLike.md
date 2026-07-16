[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorStatusLike

# Interface: ConsolidatorStatusLike

Defined in: [packages/server/src/consolidator/daemon.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L54)

Subset of `ConsolidatorStatus` the server health endpoint and the
Prometheus metrics consume. The full struct lives in
`@graphorin/memory/consolidator`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-budget"></a> `budget` | `readonly` | \{ `costRemaining`: `number`; `costUsedToday`: `number`; `resetAt`: `string`; `tokensRemaining`: `number`; `tokensUsedToday`: `number`; \} | [packages/server/src/consolidator/daemon.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L62) |
| `budget.costRemaining` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L66) |
| `budget.costUsedToday` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L64) |
| `budget.resetAt` | `readonly` | `string` | [packages/server/src/consolidator/daemon.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L67) |
| `budget.tokensRemaining` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L65) |
| `budget.tokensUsedToday` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L63) |
| <a id="property-deferredruns"></a> `deferredRuns` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L60) |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L59) |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L61) |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | [packages/server/src/consolidator/daemon.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L57) |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | [packages/server/src/consolidator/daemon.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L58) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | [packages/server/src/consolidator/daemon.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L56) |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | [packages/server/src/consolidator/daemon.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L55) |
