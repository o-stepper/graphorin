[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNodeRun

# Type Alias: WorkflowNodeRun\&lt;TState\&gt;

```ts
type WorkflowNodeRun<TState> = (state, ctx) => 
  | Promise<NodeRunResult<TState>>
| NodeRunResult<TState>;
```

Defined in: packages/workflow/src/types.ts:204

**`Stable`**

Per-node run callback.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `Readonly`\&lt;`TState`\&gt; |
| `ctx` | [`WorkflowContext`](/api/@graphorin/workflow/interfaces/WorkflowContext.md)\&lt;`TState`\&gt; |

## Returns

  \| `Promise`\<[`NodeRunResult`](/api/@graphorin/workflow/type-aliases/NodeRunResult.md)\&lt;`TState`\&gt;\>
  \| [`NodeRunResult`](/api/@graphorin/workflow/type-aliases/NodeRunResult.md)\&lt;`TState`\&gt;
