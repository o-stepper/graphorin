[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TimerPauseValue

# Interface: TimerPauseValue

Defined in: [packages/core/src/channels/durable.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L38)

Pause value carried by a durable-timer suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.timer"` | - | [packages/core/src/channels/durable.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L39) |
| <a id="property-wakeat"></a> `wakeAt` | `readonly` | `number` | Epoch milliseconds at which the timer becomes due. | [packages/core/src/channels/durable.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L41) |
