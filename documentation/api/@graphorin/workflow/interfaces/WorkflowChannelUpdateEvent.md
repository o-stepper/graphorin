[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowChannelUpdateEvent

# Interface: WorkflowChannelUpdateEvent\&lt;TState\&gt;

Defined in: [packages/core/dist/types/workflow-event.d.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L47)

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channel"></a> `channel` | `readonly` | keyof `TState` & `string` | - | [packages/core/dist/types/workflow-event.d.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L50) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/core/dist/types/workflow-event.d.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L49) |
| <a id="property-type"></a> `type` | `readonly` | `"workflow.channel.update"` | - | [packages/core/dist/types/workflow-event.d.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L48) |
| <a id="property-value"></a> `value?` | `readonly` | `unknown` | The merged value, carried ONLY for `ephemeral` channels (workflow-07): their values are wiped from state before the next planning round, so this event is the one place a consumer can observe them. Persistent channels omit it - read the state instead. | [packages/core/dist/types/workflow-event.d.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L58) |
| <a id="property-version"></a> `version` | `readonly` | `number` | - | [packages/core/dist/types/workflow-event.d.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts#L51) |
