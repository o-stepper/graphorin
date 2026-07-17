[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / node

# node

`createNode({...})` - minimal factory wrapper for declaring a
workflow node. Returns a [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md) carrying the
supplied `name` + `run(...)` callback.

## Functions

| Function | Description |
| ------ | ------ |
| [createNode](/api/@graphorin/workflow/node/functions/createNode.md) | Construct a [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md). The wrapper exists to give the engine a stable shape and to keep `createWorkflow({...})` callers from instantiating nodes by hand. Carries the optional per-node execution policy (D1 / workflow-03): `timeoutMs` + `retry`. |

## References

### NodeRunResult

Re-exports [NodeRunResult](/api/@graphorin/workflow/type-aliases/NodeRunResult.md)

***

### WorkflowNode

Re-exports [WorkflowNode](/api/@graphorin/workflow/interfaces/WorkflowNode.md)

***

### WorkflowNodeRun

Re-exports [WorkflowNodeRun](/api/@graphorin/workflow/type-aliases/WorkflowNodeRun.md)
