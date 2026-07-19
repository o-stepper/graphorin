[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDaemonStatus

# Interface: WorkflowTimerDaemonStatus

Defined in: packages/server/src/workflows/timer-daemon.ts:41

**`Stable`**

Snapshot exposed via [WorkflowTimerDaemon.status](/api/@graphorin/server/interfaces/WorkflowTimerDaemon.md#status) + the
`/v1/health` aggregator.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-errors"></a> `errors` | `readonly` | `number` | packages/server/src/workflows/timer-daemon.ts:45 |
| <a id="property-fired"></a> `fired` | `readonly` | `number` | packages/server/src/workflows/timer-daemon.ts:44 |
| <a id="property-lastsweepat"></a> `lastSweepAt?` | `readonly` | `string` | packages/server/src/workflows/timer-daemon.ts:46 |
| <a id="property-nextwakeat"></a> `nextWakeAt?` | `readonly` | `string` | packages/server/src/workflows/timer-daemon.ts:47 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/server/src/workflows/timer-daemon.ts:42 |
| <a id="property-sweeps"></a> `sweeps` | `readonly` | `number` | packages/server/src/workflows/timer-daemon.ts:43 |
