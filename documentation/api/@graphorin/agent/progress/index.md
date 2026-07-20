[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / progress

# progress

Structured progress-artifact IO. Persists UTF-8 text artifacts
under `<artifactRoot>/<runId>/progress/<role>.<seqPadded>.txt`
via atomic-write `.tmp + rename` discipline.

Cross-session continuity flow:

1. The current agent calls `agent.progress.write(content)` -
   runtime persists the file and queues the
   `agent.progress.written` event (drained into the active or
   next consumed stream).
2. A sibling / future agent calls
   `agent.progress.read({ runId: priorRunId })` - runtime
   discovers existing files (no implicit auto-discovery; the
   operator must supply the `runId` cursor).

Auto-discovery across runs is deferred to v0.2.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ProgressIO](/api/@graphorin/agent/progress/interfaces/ProgressIO.md) | Public surface returned by [createProgressIO](/api/@graphorin/agent/progress/functions/createProgressIO.md). Used by the agent runtime to back `agent.progress.write / read`. |
| [ProgressIOConfig](/api/@graphorin/agent/progress/interfaces/ProgressIOConfig.md) | Optional configuration accepted by [createProgressIO](/api/@graphorin/agent/progress/functions/createProgressIO.md). |
| [ProgressReadOptions](/api/@graphorin/agent/progress/interfaces/ProgressReadOptions.md) | Per-call options for [ProgressIO.read](/api/@graphorin/agent/progress/interfaces/ProgressIO.md#read). |
| [ProgressWriteOptions](/api/@graphorin/agent/progress/interfaces/ProgressWriteOptions.md) | Per-call options for [ProgressIO.write](/api/@graphorin/agent/progress/interfaces/ProgressIO.md#write). |

## Functions

| Function | Description |
| ------ | ------ |
| [createProgressIO](/api/@graphorin/agent/progress/functions/createProgressIO.md) | Build a [ProgressIO](/api/@graphorin/agent/progress/interfaces/ProgressIO.md) bound to a particular artifact root. |
