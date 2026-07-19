[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateTriggersDaemonOptions

# Interface: CreateTriggersDaemonOptions

Defined in: packages/server/src/triggers/daemon.ts:56

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | - | packages/server/src/triggers/daemon.ts:57 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger. Defaults to the standard error stream so the daemon never depends on the framework logger directly. | packages/server/src/triggers/daemon.ts:62 |
