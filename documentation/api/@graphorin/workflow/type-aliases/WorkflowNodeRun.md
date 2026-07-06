[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowNodeRun

# Type Alias: WorkflowNodeRun\<TState\>

```ts
type WorkflowNodeRun<TState> = (state, ctx) => 
  | Promise<NodeRunResult<TState>>
| NodeRunResult<TState>;
```

Defined in: packages/workflow/src/types.ts:204

Per-node run callback.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `Readonly`\<`TState`\> |
| `ctx` | [`WorkflowContext`](/api/@graphorin/workflow/interfaces/WorkflowContext.md)\<`TState`\> |

## Returns

  \| `Promise`\<[`NodeRunResult`](/api/@graphorin/workflow/type-aliases/NodeRunResult.md)\<`TState`\>\>
  \| [`NodeRunResult`](/api/@graphorin/workflow/type-aliases/NodeRunResult.md)\<`TState`\>

## Stable
