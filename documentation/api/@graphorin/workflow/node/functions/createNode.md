[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [node](/api/@graphorin/workflow/node/index.md) / createNode

# Function: createNode()

```ts
function createNode<TState>(opts): WorkflowNode<TState>;
```

Defined in: packages/workflow/src/node.ts:18

Construct a [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md). The wrapper exists to give the
engine a stable shape and to keep `createWorkflow({...})` callers
from instantiating nodes by hand.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `name`: `string`; `run`: [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt;; \} |
| `opts.name` | `string` |
| `opts.run` | [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt; |

## Returns

[`WorkflowNode`](/api/@graphorin/workflow/interfaces/WorkflowNode.md)\&lt;`TState`\&gt;

## Stable
