[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemonMetrics

# Interface: TriggersDaemonMetrics

Defined in: [packages/server/src/triggers/daemon.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L47)

Aggregate counters surfaced through the Prometheus
`/v1/metrics` exposition. Updated incrementally as the scheduler
publishes lifecycle events.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-catchupapplied"></a> `catchupApplied` | `readonly` | `number` | [packages/server/src/triggers/daemon.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L49) |
| <a id="property-fires"></a> `fires` | `readonly` | `ReadonlyMap`\&lt;`string`, \{ `error`: `number`; `success`: `number`; \}\&gt; | [packages/server/src/triggers/daemon.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L48) |
| <a id="property-libmodewarnings"></a> `libModeWarnings` | `readonly` | `number` | [packages/server/src/triggers/daemon.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L50) |
