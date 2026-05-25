[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentEvent

# Type Alias: AgentEvent\&lt;TOutput\&gt;

```ts
type AgentEvent<TOutput> = 
  | AgentStartEvent
  | StepStartEvent
  | TextDeltaEvent
  | TextCompleteEvent
  | ReasoningDeltaEvent
  | ToolCallStartEvent
  | ToolCallDeltaEvent
  | ToolCallEndEvent
  | ToolExecuteStartEvent
  | ToolExecuteProgressEvent
  | ToolExecutePartialEvent
  | ToolExecuteEndEvent
  | ToolExecuteErrorEvent
  | ToolApprovalRequestedEvent
  | ToolApprovalGrantedEvent
  | ToolApprovalDeniedEvent
  | MemoryReadEvent
  | MemoryWriteEvent
  | ContextCompactedEvent
  | HandoffEvent
  | AgentSteeredEvent
  | AgentFollowUpQueuedEvent
  | AgentCancellingEvent
  | AgentModelFellbackEvent
  | AgentFanOutSpawnedEvent
  | AgentFanOutMergedEvent
  | AgentEvaluatorIterationEvent
  | AgentEvaluatorConvergedEvent
  | AgentProgressWrittenEvent
  | AgentProgressReadEvent
  | AgentLateralLeakDetectedEvent
  | StepEndEvent
  | GuardrailTrippedEvent
  | AgentEndEvent<TOutput>
  | AgentErrorEvent;
```

Defined in: packages/core/src/types/agent-event.ts:19

Discriminated union of every event produced by `Agent.stream(...)`.

Each variant has a literal `type` field used as the discriminator. The
union is exhaustive: `assertNever(...)` catches missed variants at
compile time.

The shape is wire-stable: the protocol package (`@graphorin/protocol`,
created in a later phase) re-exports this union as its server-to-client
payload schema. Adding a variant here therefore counts as a wire-format
change; track it through changesets.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Stable
