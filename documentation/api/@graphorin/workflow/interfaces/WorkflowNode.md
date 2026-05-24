[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNode

# Interface: WorkflowNode\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:149

Pure node contract. The runtime invokes `run(state, ctx)` exactly
once per scheduled task; the return value is converted into channel
writes by the engine.

Returning a single [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md) or an array of dispatches
schedules new tasks instead of writing to channels.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/workflow/src/types.ts:150 |
| <a id="property-run"></a> `run` | `readonly` | [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt; | packages/workflow/src/types.ts:151 |
