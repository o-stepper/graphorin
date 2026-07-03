[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentInput

# Type Alias: AgentInput

```ts
type AgentInput = 
  | string
  | Message
| ReadonlyArray<Message>;
```

Defined in: packages/agent/src/types.ts:47

Forward-compatible type alias for the input accepted by
`Agent.stream / run / steer / followUp`. v0.1 ships with the
canonical text + multimodal Message shape; future versions may
add structured inputs.

## Stable
