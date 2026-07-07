[**Graphorin API reference v0.7.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [factory](/api/@graphorin/workflow/factory/index.md) / createWorkflow

# Function: createWorkflow()

```ts
function createWorkflow<TState, TInput>(config): Workflow<TState, TInput>;
```

Defined in: [packages/workflow/src/factory.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/factory.ts#L49)

Build a [Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) from the supplied configuration. The
factory performs eager validation so misuse is caught at build time
rather than mid-execution.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\&lt;`string`, `unknown`\&gt; |
| `TInput` *extends* `Partial`\&lt;`TState`\&gt; | `Partial`\&lt;`TState`\&gt; |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`WorkflowConfig`](/api/@graphorin/workflow/interfaces/WorkflowConfig.md)\&lt;`TState`\&gt; |

## Returns

[`Workflow`](/api/@graphorin/workflow/interfaces/Workflow.md)\&lt;`TState`, `TInput`\&gt;

## Stable
