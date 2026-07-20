[**Graphorin API reference v0.13.4**](../../../index.md)

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
| [CheckpointNotFoundError](/api/@graphorin/workflow/errors/classes/CheckpointNotFoundError.md) | Thrown when `Workflow.fork` cannot find the named checkpoint. |
| [CheckpointVersionConflictError](/api/@graphorin/workflow/errors/classes/CheckpointVersionConflictError.md) | Thrown when a checkpoint write detects that another writer advanced the thread concurrently - the loser must not fork the timeline. |
| [ConcurrentResumeError](/api/@graphorin/workflow/errors/classes/ConcurrentResumeError.md) | Thrown when a second concurrent resume is attempted for the same thread. |
| [DeadEndError](/api/@graphorin/workflow/errors/classes/DeadEndError.md) | Thrown when planning stalls with no runnable tasks and no satisfied END edge - an all-false conditional fan is an error, not a silent completion. |
| [InvalidChannelWriteError](/api/@graphorin/workflow/errors/classes/InvalidChannelWriteError.md) | Thrown when a node writes a key not declared in `stateSchema`. |
| [InvalidWorkflowConfigError](/api/@graphorin/workflow/errors/classes/InvalidWorkflowConfigError.md) | Thrown by `createWorkflow` on configuration validation failure. |
| [MultiWriteError](/api/@graphorin/workflow/errors/classes/MultiWriteError.md) | Thrown when more than one writer in a single execution step writes a `LatestValue`. |
| [NodeExecutionError](/api/@graphorin/workflow/errors/classes/NodeExecutionError.md) | Thrown when a node throws and the failure is propagated through the engine. |
| [NodeTimeoutError](/api/@graphorin/workflow/errors/classes/NodeTimeoutError.md) | Thrown when a node body exceeds its wall-clock budget. The task's `ctx.signal` is aborted first so a well-behaved body can stop; bodies that ignore the signal keep running in the background (same contract as cancellation). |
| [PauseNotFoundError](/api/@graphorin/workflow/errors/classes/PauseNotFoundError.md) | Thrown by `resolveAwakeable` / `approve` when no pending pause carries the requested name. |
| [ReducerError](/api/@graphorin/workflow/errors/classes/ReducerError.md) | Thrown when a `Reducer` channel's `reduce(...)` callback throws. |
| [ResumeWithoutSuspensionError](/api/@graphorin/workflow/errors/classes/ResumeWithoutSuspensionError.md) | Thrown by `Workflow.resume` when the named thread is not in a suspended state. |
| [StateNotSerializableError](/api/@graphorin/workflow/errors/classes/StateNotSerializableError.md) | Thrown when a value that rides the checkpoint would not survive a JSON round-trip - Map/Set/Date/class instances silently degrade with the SQLite store, so every store rejects them eagerly. Covers EVERYTHING that round-trips through the checkpoint: channel state, pause values and approval payloads, dispatchArgs, satisfied resume values, and operator directives (validated at resume entry, before the node body runs). The pseudo-channels `<pause:node>` / `<dispatch:node>` / `<task:node>` / `<directive>` name the offending surface. |
| [ThreadNotFoundError](/api/@graphorin/workflow/errors/classes/ThreadNotFoundError.md) | Thrown when `Workflow.resume` cannot find the named thread. |
| [UnknownNodeError](/api/@graphorin/workflow/errors/classes/UnknownNodeError.md) | Thrown by `createWorkflow` when an edge references a node that is not registered. |
| [WorkflowAbortedError](/api/@graphorin/workflow/errors/classes/WorkflowAbortedError.md) | Thrown when a workflow run is cancelled via `AbortSignal`. |
| [WorkflowDivergenceError](/api/@graphorin/workflow/errors/classes/WorkflowDivergenceError.md) | Thrown on resume when the persisted frontier references nodes that no longer exist in the workflow definition - the definition changed mid-flight and a silent re-plan would diverge from the journal. |
| [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) | Base error class for all `@graphorin/workflow` failures. |
| [WorkflowVersionMismatchError](/api/@graphorin/workflow/errors/classes/WorkflowVersionMismatchError.md) | Thrown on resume when the stored frontier was written by a different `WorkflowConfig.version` - replaying persisted state through changed code must fail loudly, not silently diverge. Opt out per call via `allowVersionMismatch`. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [WorkflowErrorCode](/api/@graphorin/workflow/errors/type-aliases/WorkflowErrorCode.md) | Stable `code` discriminator on every [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) subclass. Treat as a string literal union for `switch (err.code)` style code. |
