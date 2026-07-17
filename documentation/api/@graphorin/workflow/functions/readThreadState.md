[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / readThreadState

# Function: readThreadState()

```ts
function readThreadState(
   store, 
   workflowName, 
   threadId): Promise<
  | ThreadInspection
| null>;
```

Defined in: [packages/workflow/src/inspect.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/inspect.ts#L64)

Read the latest checkpoint of `threadId` under workflow
`workflowName` and decode it exactly like `Workflow.getState` does
(versioned state envelope + frontier tag). Returns `null` when the
thread does not exist in that namespace - an operator CLI reports
that instead of throwing.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `store` | [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md) |
| `workflowName` | `string` |
| `threadId` | `string` |

## Returns

`Promise`\<
  \| [`ThreadInspection`](/api/@graphorin/workflow/interfaces/ThreadInspection.md)
  \| `null`\>

## Stable
