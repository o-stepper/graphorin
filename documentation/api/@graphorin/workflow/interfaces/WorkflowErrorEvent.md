[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowErrorEvent

# Interface: WorkflowErrorEvent

Defined in: packages/core/dist/types/workflow-event.d.ts:94

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | packages/core/dist/types/workflow-event.d.ts:97 |
| `error.code` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:99 |
| `error.message` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:98 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/dist/types/workflow-event.d.ts:96 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.error"` | packages/core/dist/types/workflow-event.d.ts:95 |
