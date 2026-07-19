[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / toWireAgentEvent

# Function: toWireAgentEvent()

```ts
function toWireAgentEvent<TOutput>(ev): WireAgentEvent<TOutput>;
```

Defined in: packages/core/src/types/agent-event-wire.ts:132

**`Stable`**

Project an [AgentEvent](/api/@graphorin/core/type-aliases/AgentEvent.md) into its JSON-safe [WireAgentEvent](/api/@graphorin/core/type-aliases/WireAgentEvent.md)
twin. Idempotent: projecting an already-wire event returns an
equivalent value. Events of unknown `type` pass through untouched.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ev` | \| [`AgentStartEvent`](/api/@graphorin/core/interfaces/AgentStartEvent.md) \| [`StepStartEvent`](/api/@graphorin/core/interfaces/StepStartEvent.md) \| [`TextDeltaEvent`](/api/@graphorin/core/interfaces/TextDeltaEvent.md) \| [`TextCompleteEvent`](/api/@graphorin/core/interfaces/TextCompleteEvent.md) \| [`ReasoningDeltaEvent`](/api/@graphorin/core/interfaces/ReasoningDeltaEvent.md) \| [`ToolCallStartEvent`](/api/@graphorin/core/interfaces/ToolCallStartEvent.md) \| [`ToolCallDeltaEvent`](/api/@graphorin/core/interfaces/ToolCallDeltaEvent.md) \| [`ToolCallEndEvent`](/api/@graphorin/core/interfaces/ToolCallEndEvent.md) \| [`ToolCallIncompleteEvent`](/api/@graphorin/core/interfaces/ToolCallIncompleteEvent.md) \| [`ToolExecuteStartEvent`](/api/@graphorin/core/interfaces/ToolExecuteStartEvent.md) \| [`ToolExecuteProgressEvent`](/api/@graphorin/core/interfaces/ToolExecuteProgressEvent.md) \| [`ToolExecutePartialEvent`](/api/@graphorin/core/interfaces/ToolExecutePartialEvent.md) \| [`ToolExecuteEndEvent`](/api/@graphorin/core/interfaces/ToolExecuteEndEvent.md) \| [`ToolExecuteErrorEvent`](/api/@graphorin/core/interfaces/ToolExecuteErrorEvent.md) \| [`ToolApprovalRequestedEvent`](/api/@graphorin/core/interfaces/ToolApprovalRequestedEvent.md) \| [`ToolApprovalGrantedEvent`](/api/@graphorin/core/interfaces/ToolApprovalGrantedEvent.md) \| [`ToolApprovalDeniedEvent`](/api/@graphorin/core/interfaces/ToolApprovalDeniedEvent.md) \| [`ContextCompactedEvent`](/api/@graphorin/core/interfaces/ContextCompactedEvent.md) \| [`HandoffEvent`](/api/@graphorin/core/interfaces/HandoffEvent.md) \| [`AgentSteeredEvent`](/api/@graphorin/core/interfaces/AgentSteeredEvent.md) \| [`AgentFollowUpQueuedEvent`](/api/@graphorin/core/interfaces/AgentFollowUpQueuedEvent.md) \| [`AgentCancellingEvent`](/api/@graphorin/core/interfaces/AgentCancellingEvent.md) \| [`AgentModelFellbackEvent`](/api/@graphorin/core/interfaces/AgentModelFellbackEvent.md) \| [`AgentFanOutSpawnedEvent`](/api/@graphorin/core/interfaces/AgentFanOutSpawnedEvent.md) \| [`AgentFanOutMergedEvent`](/api/@graphorin/core/interfaces/AgentFanOutMergedEvent.md) \| [`AgentEvaluatorIterationEvent`](/api/@graphorin/core/interfaces/AgentEvaluatorIterationEvent.md) \| [`AgentEvaluatorConvergedEvent`](/api/@graphorin/core/interfaces/AgentEvaluatorConvergedEvent.md) \| [`AgentProgressWrittenEvent`](/api/@graphorin/core/interfaces/AgentProgressWrittenEvent.md) \| [`AgentProgressReadEvent`](/api/@graphorin/core/interfaces/AgentProgressReadEvent.md) \| [`AgentLateralLeakDetectedEvent`](/api/@graphorin/core/interfaces/AgentLateralLeakDetectedEvent.md) \| `FileGeneratedEvent` \| `SourceCitedEvent` \| [`StepEndEvent`](/api/@graphorin/core/interfaces/StepEndEvent.md) \| [`GuardrailTrippedEvent`](/api/@graphorin/core/interfaces/GuardrailTrippedEvent.md) \| [`VerifierResultEvent`](/api/@graphorin/core/interfaces/VerifierResultEvent.md) \| `SubagentEvent` \| [`AgentErrorEvent`](/api/@graphorin/core/interfaces/AgentErrorEvent.md) \| [`WireFileGeneratedEvent`](/api/@graphorin/core/interfaces/WireFileGeneratedEvent.md) \| [`WireToolExecutePartialEvent`](/api/@graphorin/core/interfaces/WireToolExecutePartialEvent.md) \| `WireSubagentEvent` \| [`AgentEndEvent`](/api/@graphorin/core/interfaces/AgentEndEvent.md)\&lt;`TOutput`\&gt; \| [`WireAgentEndEvent`](/api/@graphorin/core/interfaces/WireAgentEndEvent.md)\&lt;`TOutput`\&gt; |

## Returns

[`WireAgentEvent`](/api/@graphorin/core/type-aliases/WireAgentEvent.md)\&lt;`TOutput`\&gt;
