[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowErrorEvent

# Interface: WorkflowErrorEvent

Defined in: [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts)

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| `error.code` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| `error.message` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.error"` | [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts) |
