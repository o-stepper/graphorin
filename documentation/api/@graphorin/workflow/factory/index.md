[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / factory

# factory

`createWorkflow({...})` — the public entry point for the workflow
runtime. Validates the supplied configuration and returns the
[Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) handle that exposes `execute / resume / getState /
listCheckpoints / fork`.

## Functions

| Function | Description |
| ------ | ------ |
| [createWorkflow](/api/@graphorin/workflow/factory/functions/createWorkflow.md) | Build a [Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) from the supplied configuration. The factory performs eager validation so misuse is caught at build time rather than mid-execution. |
