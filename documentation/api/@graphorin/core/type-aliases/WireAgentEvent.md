[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAgentEvent

# Type Alias: WireAgentEvent\&lt;TOutput\&gt;

```ts
type WireAgentEvent<TOutput> = 
  | Exclude<AgentEvent<TOutput>, 
  | FileGeneratedEvent
  | ToolExecutePartialEvent
  | AgentEndEvent<TOutput>>
  | WireFileGeneratedEvent
  | WireToolExecutePartialEvent
| WireAgentEndEvent<TOutput>;
```

Defined in: packages/core/src/types/agent-event-wire.ts:73

JSON-safe twin of [AgentEvent](/api/@graphorin/core/type-aliases/AgentEvent.md): the three binary-bearing
variants are replaced by their wire twins, every other variant
passes through structurally unchanged.

This is the actual payload shape a server puts on the wire (inside
the `{ eventId, subject, type, payload }` envelope) - see
[toWireAgentEvent](/api/@graphorin/core/functions/toWireAgentEvent.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `string` |

## Stable
