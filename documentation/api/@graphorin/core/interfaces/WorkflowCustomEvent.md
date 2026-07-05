[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowCustomEvent

# Interface: WorkflowCustomEvent

Defined in: packages/core/src/types/workflow-event.ts:128

Application-defined event emitted from inside a workflow node via
`ctx.emit(name, payload)`. The runtime never produces these on its own.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:130 |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | packages/core/src/types/workflow-event.ts:131 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.custom"` | packages/core/src/types/workflow-event.ts:129 |
