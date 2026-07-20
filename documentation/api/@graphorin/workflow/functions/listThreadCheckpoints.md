[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / listThreadCheckpoints

# Function: listThreadCheckpoints()

```ts
function listThreadCheckpoints(
   store, 
   workflowName, 
threadId): Promise<readonly ThreadCheckpointSummary[]>;
```

Defined in: packages/workflow/src/inspect.ts:93

**`Stable`**

List every persisted checkpoint of `threadId` under workflow
`workflowName`, newest first as the store yields them, summarised
for operator display (id, parent, step, status, node).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `store` | [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md) |
| `workflowName` | `string` |
| `threadId` | `string` |

## Returns

`Promise`\&lt;readonly [`ThreadCheckpointSummary`](/api/@graphorin/workflow/interfaces/ThreadCheckpointSummary.md)[]\&gt;
