[**Graphorin API reference v0.13.11**](../../../index.md)

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
  | ToolCallIncompleteEvent
  | ToolExecuteStartEvent
  | ToolExecuteProgressEvent
  | ToolExecutePartialEvent
  | ToolExecuteEndEvent
  | ToolExecuteErrorEvent
  | ToolApprovalRequestedEvent
  | ToolApprovalGrantedEvent
  | ToolApprovalDeniedEvent
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
  | FileGeneratedEvent
  | SourceCitedEvent
  | StepEndEvent
  | GuardrailTrippedEvent
  | VerifierResultEvent
  | SubagentEvent
  | AgentEndEvent<TOutput>
  | AgentErrorEvent;
```

Defined in: packages/core/src/types/agent-event.ts:33

**`Stable`**

Discriminated union of every event produced by `Agent.stream(...)`.

Each variant has a literal `type` field used as the discriminator. The
union is exhaustive: `assertNever(...)` catches missed variants at
compile time.

Wire contract (two layers): the server delivers events inside an
envelope `{ eventId, subject, type, payload }` where `payload` is the
JSON-safe `WireAgentEvent` projection (`toWireAgentEvent`), NOT this
raw union - three variants (`file.generated`, `tool.execute.partial`,
`agent.end`) carry `Uint8Array`/`URL` payloads that plain
`JSON.stringify` would corrupt. `@graphorin/protocol` validates the
envelope and leaves `payload` opaque (`z.unknown()`); clients decode
with `fromWireAgentEvent`. Adding a variant here counts as a
wire-format change; track it through changesets.

Correlation policy: events are consumed from a per-run
stream, so cross-run attribution is the ENVELOPE's job (`subject`
carries `agentId`/`runId`); an in-payload `runId` exists only on the
variants that historically carry one and is deliberately NOT
retrofitted onto the rest. Within one tool lifecycle the correlation
key is `toolCallId`; `toolName` is duplicated onto the
`tool.execute.*` variants purely for subscriber convenience.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |
