[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunDescriptor

# Type Alias: RunDescriptor

```ts
type RunDescriptor = 
  | {
  agentId: string;
  kind: "agent";
  sessionId?: string;
  userId?: string;
}
  | {
  kind: "workflow";
  sessionId?: string;
  threadId?: string;
  userId?: string;
  workflowId: string;
};
```

Defined in: packages/server/src/runtime/run-state.ts:101

**`Stable`**

Bookkeeping descriptor recorded at run start. Either an agent run
(with `agentId`) or a workflow run (with `workflowId` + optional
`threadId`).
