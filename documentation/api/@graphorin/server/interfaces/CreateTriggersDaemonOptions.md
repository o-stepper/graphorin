[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateTriggersDaemonOptions

# Interface: CreateTriggersDaemonOptions

Defined in: [packages/server/src/triggers/daemon.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L56)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | - | [packages/server/src/triggers/daemon.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L57) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger. Defaults to the standard error stream so the daemon never depends on the framework logger directly. | [packages/server/src/triggers/daemon.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L62) |
