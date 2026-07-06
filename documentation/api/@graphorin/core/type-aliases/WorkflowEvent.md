[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WorkflowEvent

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

Defined in: [packages/core/src/types/workflow-event.ts:10](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/workflow-event.ts#L10)

Discriminated union of every event produced by `Workflow.execute(...)`
and `Workflow.resume(...)`.

Generic over `TState` so that downstream consumers can discriminate on
the workflow's typed state shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TState` | `unknown` |

## Stable
