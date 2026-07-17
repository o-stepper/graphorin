[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAgentEvent

# Type Alias: WireAgentEvent\&lt;TOutput\&gt;

```ts
type WireAgentEvent<TOutput> = 
  | Exclude<AgentEvent<TOutput>, 
  | FileGeneratedEvent
  | ToolExecutePartialEvent
  | AgentEndEvent<TOutput>
  | SubagentEvent>
  | WireFileGeneratedEvent
  | WireToolExecutePartialEvent
  | WireSubagentEvent
| WireAgentEndEvent<TOutput>;
```

Defined in: [packages/core/src/types/agent-event-wire.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L85)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |
