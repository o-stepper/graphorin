[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AwakeablePauseValue

# Interface: AwakeablePauseValue

Defined in: packages/core/src/channels/durable.ts:45

Pause value carried by an awakeable suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.awakeable"` | - | packages/core/src/channels/durable.ts:46 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen name targeted by `workflow.resolveAwakeable(...)`. | packages/core/src/channels/durable.ts:48 |
