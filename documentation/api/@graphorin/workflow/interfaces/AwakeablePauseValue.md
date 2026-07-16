[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / AwakeablePauseValue

# Interface: AwakeablePauseValue

Defined in: [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts)

Pause value carried by an awakeable suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.awakeable"` | - | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen name targeted by `workflow.resolveAwakeable(...)`. | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
