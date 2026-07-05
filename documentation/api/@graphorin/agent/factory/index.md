[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / factory

# factory

`createAgent({...})` - the agent factory entry point.

Wires the typed `model -> tool calls -> model` loop, the streamed
event surface, the steering / followUp queues, durable HITL via
`RunState`, the multi-agent handoff layer, the agent-level model
fallback chain, and the per-tool preferred-model resolution.

Custom adapters override behaviour by supplying alternative
`Provider` / `Memory` / `CheckpointStore` instances; the loop
never reaches into adapter internals.

## Functions

| Function | Description |
| ------ | ------ |
| [createAgent](/api/@graphorin/agent/factory/functions/createAgent.md) | Build a fresh [Agent](/api/@graphorin/agent/interfaces/Agent.md) from the supplied configuration. |
