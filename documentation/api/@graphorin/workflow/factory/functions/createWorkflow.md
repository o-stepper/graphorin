[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [factory](/api/@graphorin/workflow/factory/index.md) / createWorkflow

# Function: createWorkflow()

```ts
function createWorkflow<TState, TInput>(config): Workflow<TState, TInput>;
```

Defined in: packages/workflow/src/factory.ts:49

Build a [Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) from the supplied configuration. The
factory performs eager validation so misuse is caught at build time
rather than mid-execution.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` *extends* `object` | `Record`\<`string`, `unknown`\> |
| `TInput` *extends* `Partial`\<`TState`\> | `Partial`\<`TState`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`WorkflowConfig`](/api/@graphorin/workflow/interfaces/WorkflowConfig.md)\<`TState`\> |

## Returns

[`Workflow`](/api/@graphorin/workflow/interfaces/Workflow.md)\<`TState`, `TInput`\>

## Stable
