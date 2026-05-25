[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowErrorEvent

# Interface: WorkflowErrorEvent

Defined in: packages/core/dist/types/workflow-event.d.ts:87

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | packages/core/dist/types/workflow-event.d.ts:90 |
| `error.code` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:92 |
| `error.message` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:91 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:89 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.error"` | packages/core/dist/types/workflow-event.d.ts:88 |
