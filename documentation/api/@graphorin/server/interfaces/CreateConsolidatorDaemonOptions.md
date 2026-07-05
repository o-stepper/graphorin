[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateConsolidatorDaemonOptions

# Interface: CreateConsolidatorDaemonOptions

Defined in: packages/server/src/consolidator/daemon.ts:66

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | - | packages/server/src/consolidator/daemon.ts:67 |
| <a id="property-stoptimeoutms"></a> `stopTimeoutMs?` | `readonly` | `number` | Hard timeout on `consolidator.stop()`. Defaults to 10 s. | packages/server/src/consolidator/daemon.ts:69 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | - | packages/server/src/consolidator/daemon.ts:70 |
