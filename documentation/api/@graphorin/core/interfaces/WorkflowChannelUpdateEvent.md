[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowChannelUpdateEvent

# Interface: WorkflowChannelUpdateEvent\&lt;TState\&gt;

Defined in: packages/core/src/types/workflow-event.ts:64

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | keyof `TState` & `string` | packages/core/src/types/workflow-event.ts:67 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/workflow-event.ts:66 |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.channel.update"` | packages/core/src/types/workflow-event.ts:65 |
| <a id="property-version"></a> `version` | `readonly` | `number` | packages/core/src/types/workflow-event.ts:68 |
