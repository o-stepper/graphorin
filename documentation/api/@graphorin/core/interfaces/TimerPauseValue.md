[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TimerPauseValue

# Interface: TimerPauseValue

Defined in: packages/core/src/channels/durable.ts:38

Pause value carried by a durable-timer suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.timer"` | - | packages/core/src/channels/durable.ts:39 |
| <a id="property-wakeat"></a> `wakeAt` | `readonly` | `number` | Epoch milliseconds at which the timer becomes due. | packages/core/src/channels/durable.ts:41 |
