[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateConsolidatorDaemonOptions

# Interface: CreateConsolidatorDaemonOptions

Defined in: [packages/server/src/consolidator/daemon.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L74)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-consolidator"></a> `consolidator` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | - | [packages/server/src/consolidator/daemon.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L75) |
| <a id="property-stoptimeoutms"></a> `stopTimeoutMs?` | `readonly` | `number` | Hard timeout on `consolidator.stop()`. Defaults to 10 s. | [packages/server/src/consolidator/daemon.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L77) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | - | [packages/server/src/consolidator/daemon.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/consolidator/daemon.ts#L78) |
