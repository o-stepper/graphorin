[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateConsolidatorDaemonOptions

# Interface: CreateConsolidatorDaemonOptions

Defined in: packages/server/src/consolidator/daemon.ts:74

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | - | packages/server/src/consolidator/daemon.ts:75 |
| <a id="property-stoptimeoutms"></a> `stopTimeoutMs?` | `readonly` | `number` | Hard timeout on `consolidator.stop()`. Defaults to 10 s. | packages/server/src/consolidator/daemon.ts:77 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | - | packages/server/src/consolidator/daemon.ts:78 |
