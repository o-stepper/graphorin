[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNode

# Interface: WorkflowNode\&lt;TState\&gt;

Defined in: packages/workflow/src/types.ts:168

**`Stable`**

Pure node contract. The runtime invokes `run(state, ctx)` exactly
once per scheduled task; the return value is converted into channel
writes by the engine.

Returning a single [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md) or an array of dispatches
schedules new tasks instead of writing to channels.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/workflow/src/types.ts:169 |
| <a id="property-retry"></a> `retry?` | `readonly` | [`WorkflowNodeRetryPolicy`](/api/@graphorin/workflow/interfaces/WorkflowNodeRetryPolicy.md) | Per-node bounded retry policy. Retries fire only for thrown failures - never for `pause(...)` suspensions or aborts - with exponential backoff. Overrides [WorkflowConfig.nodeDefaults](/api/@graphorin/workflow/interfaces/WorkflowConfig.md#property-nodedefaults). Absent ⇒ no retries. | packages/workflow/src/types.ts:184 |
| <a id="property-run"></a> `run` | `readonly` | [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt; | - | packages/workflow/src/types.ts:170 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Per-node wall-clock budget in milliseconds. When the body exceeds it, the task's `ctx.signal` aborts and the task fails with a `node-timeout` error. Overrides [WorkflowConfig.nodeDefaults](/api/@graphorin/workflow/interfaces/WorkflowConfig.md#property-nodedefaults). Absent ⇒ no timeout. | packages/workflow/src/types.ts:177 |
