[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [node](/api/@graphorin/workflow/node/index.md) / createNode

# Function: createNode()

```ts
function createNode<TState>(opts): WorkflowNode<TState>;
```

Defined in: packages/workflow/src/node.ts:24

**`Stable`**

Construct a [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md). The wrapper exists to give the
engine a stable shape and to keep `createWorkflow({...})` callers
from instantiating nodes by hand. Carries the optional per-node
execution policy: `timeoutMs` + `retry`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `name`: `string`; `retry?`: [`WorkflowNodeRetryPolicy`](/api/@graphorin/workflow/interfaces/WorkflowNodeRetryPolicy.md); `run`: [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt;; `timeoutMs?`: `number`; \} |
| `opts.name` | `string` |
| `opts.retry?` | [`WorkflowNodeRetryPolicy`](/api/@graphorin/workflow/interfaces/WorkflowNodeRetryPolicy.md) |
| `opts.run` | [`WorkflowNodeRun`](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)\&lt;`TState`\&gt; |
| `opts.timeoutMs?` | `number` |

## Returns

[`WorkflowNode`](/api/@graphorin/workflow/interfaces/WorkflowNode.md)\&lt;`TState`\&gt;
