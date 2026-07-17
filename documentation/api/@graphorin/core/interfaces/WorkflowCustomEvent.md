[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowCustomEvent

# Interface: WorkflowCustomEvent

Defined in: [packages/core/src/types/workflow-event.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L128)

Application-defined event emitted from inside a workflow node via
`ctx.emit(name, payload)`. The runtime never produces these on its own.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/core/src/types/workflow-event.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L130) |
| <a id="property-payload"></a> `payload` | `readonly` | `unknown` | [packages/core/src/types/workflow-event.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L131) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.custom"` | [packages/core/src/types/workflow-event.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L129) |
