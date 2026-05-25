[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / errors

# errors

Typed error surface for `@graphorin/workflow`. Every workflow-level
failure lands as a subclass of [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) carrying the
stable string `code` discriminator so consumers can pattern-match
without inspecting messages.

## Classes

| Class | Description |
| ------ | ------ |
| [CheckpointNotFoundError](/api/@graphorin/workflow/errors/classes/CheckpointNotFoundError.md) | Thrown when Workflow.fork cannot find the named checkpoint. |
| [ConcurrentResumeError](/api/@graphorin/workflow/errors/classes/ConcurrentResumeError.md) | Thrown when a second concurrent resume is attempted for the same thread. |
| [InvalidChannelWriteError](/api/@graphorin/workflow/errors/classes/InvalidChannelWriteError.md) | Thrown when a node writes a key not declared in `stateSchema`. |
| [InvalidWorkflowConfigError](/api/@graphorin/workflow/errors/classes/InvalidWorkflowConfigError.md) | Thrown by createWorkflow on configuration validation failure. |
| [MultiWriteError](/api/@graphorin/workflow/errors/classes/MultiWriteError.md) | Thrown when more than one writer in a single execution step writes a `LatestValue`. |
| [NodeExecutionError](/api/@graphorin/workflow/errors/classes/NodeExecutionError.md) | Thrown when a node throws and the failure is propagated through the engine. |
| [ReducerError](/api/@graphorin/workflow/errors/classes/ReducerError.md) | Thrown when a Reducer channel's `reduce(...)` callback throws. |
| [ResumeWithoutSuspensionError](/api/@graphorin/workflow/errors/classes/ResumeWithoutSuspensionError.md) | Thrown by Workflow.resume when the named thread is not in a suspended state. |
| [ThreadNotFoundError](/api/@graphorin/workflow/errors/classes/ThreadNotFoundError.md) | Thrown when Workflow.resume cannot find the named thread. |
| [UnknownNodeError](/api/@graphorin/workflow/errors/classes/UnknownNodeError.md) | Thrown by createWorkflow when an edge references a node that is not registered. |
| [WorkflowAbortedError](/api/@graphorin/workflow/errors/classes/WorkflowAbortedError.md) | Thrown when a workflow run is cancelled via `AbortSignal`. |
| [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) | Base error class for all `@graphorin/workflow` failures. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [WorkflowErrorCode](/api/@graphorin/workflow/errors/type-aliases/WorkflowErrorCode.md) | Stable `code` discriminator on every [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) subclass. Treat as a string literal union for `switch (err.code)` style code. |
