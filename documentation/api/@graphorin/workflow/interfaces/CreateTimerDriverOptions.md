[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / CreateTimerDriverOptions

# Interface: CreateTimerDriverOptions

Defined in: packages/workflow/src/timer-driver.ts:56

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchlimit"></a> `batchLimit?` | `readonly` | `number` | Max due threads ticked per workflow per sweep. Default 100. | packages/workflow/src/timer-driver.ts:61 |
| <a id="property-cleartimeoutimpl"></a> `clearTimeoutImpl?` | `readonly` | (`handle`) => `void` | - | packages/workflow/src/timer-driver.ts:65 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Injectable clock (offline tests). Default `Date.now`. | packages/workflow/src/timer-driver.ts:63 |
| <a id="property-onerror"></a> `onError?` | `readonly` | (`workflowName`, `threadId`, `error`) => `void` | Per-thread failure sink; the driver survives and moves on. A `checkpoint-version-conflict` never reaches it - in a multi-process deployment two drivers may race the same due thread and the store CAS makes the loser benign by design. | packages/workflow/src/timer-driver.ts:72 |
| <a id="property-pollintervalms"></a> `pollIntervalMs?` | `readonly` | `number` | Poll interval upper bound (ms). Default 30000. | packages/workflow/src/timer-driver.ts:59 |
| <a id="property-settimeoutimpl"></a> `setTimeoutImpl?` | `readonly` | (`fn`, `ms`) => `unknown` | - | packages/workflow/src/timer-driver.ts:64 |
| <a id="property-workflows"></a> `workflows` | `readonly` | readonly [`TimerDriverEntry`](/api/@graphorin/workflow/interfaces/TimerDriverEntry.md)[] | - | packages/workflow/src/timer-driver.ts:57 |
