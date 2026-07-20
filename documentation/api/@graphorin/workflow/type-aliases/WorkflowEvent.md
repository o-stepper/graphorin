[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowEvent

# Type Alias: WorkflowEvent\&lt;TState\&gt;

```ts
type WorkflowEvent<TState> = 
  | WorkflowStartEvent
  | WorkflowStepStartEvent<TState>
  | WorkflowStepEndEvent<TState>
  | WorkflowTaskStartEvent
  | WorkflowTaskEndEvent
  | WorkflowChannelUpdateEvent<TState>
  | WorkflowCheckpointWrittenEvent
  | WorkflowSuspendedEvent<TState>
  | WorkflowResumedEvent<TState>
  | WorkflowEndEvent<TState>
  | WorkflowErrorEvent
  | WorkflowCustomEvent;
```

Defined in: [packages/core/dist/types/workflow-event.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/workflow-event.d.ts)

**`Stable`**

Discriminated union of every event produced by `Workflow.execute(...)`
and `Workflow.resume(...)`.

Generic over `TState` so that downstream consumers can discriminate on
the workflow's typed state shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |
