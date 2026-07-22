[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowCustomEvent

# Interface: WorkflowCustomEvent

Defined in: [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts)

**`Stable`**

Application-defined event emitted from inside a workflow node via
`ctx.emit(name, payload)`. The runtime never produces these on its own.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.custom"` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
