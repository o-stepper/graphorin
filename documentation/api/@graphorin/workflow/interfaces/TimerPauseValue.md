[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TimerPauseValue

# Interface: TimerPauseValue

Defined in: packages/core/dist/channels/durable.d.ts:35

Pause value carried by a durable-timer suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.timer"` | - | packages/core/dist/channels/durable.d.ts:36 |
| <a id="property-wakeat"></a> `wakeAt` | `readonly` | `number` | Epoch milliseconds at which the timer becomes due. | packages/core/dist/channels/durable.d.ts:38 |
