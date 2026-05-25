[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowErrorEvent

# Interface: WorkflowErrorEvent

Defined in: packages/core/src/types/workflow-event.ts:109

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | packages/core/src/types/workflow-event.ts:112 |
| `error.code` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:112 |
| `error.message` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:112 |
| <a id="property-threadid"></a> `threadId` | `readonly` | `string` | packages/core/src/types/workflow-event.ts:111 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.error"` | packages/core/src/types/workflow-event.ts:110 |
