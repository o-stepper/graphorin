[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowCustomEvent

# Interface: WorkflowCustomEvent

Defined in: packages/core/src/types/workflow-event.ts:121

Application-defined event emitted from inside a workflow node via
`ctx.emit(name, payload)`. The runtime never produces these on its own.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:123 |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | packages/core/src/types/workflow-event.ts:124 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.custom"` | packages/core/src/types/workflow-event.ts:122 |
