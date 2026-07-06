[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAIOperationName

# Type Alias: GenAIOperationName

```ts
type GenAIOperationName = 
  | "invoke_agent"
  | "agent.run"
  | "agent.step"
  | "agent.handoff"
  | "agent.suspend"
  | "agent.resume"
  | "agent.fanout.spawned"
  | "agent.fanout.merged"
  | "agent.evaluator.iteration"
  | "chat"
  | "embedding"
  | "execute_tool"
  | "memory.read"
  | "memory.write"
  | "memory.search"
  | "memory.consolidate"
  | "memory.conflict"
  | "workflow.run"
  | "workflow.step"
  | "workflow.task"
  | "workflow.checkpoint"
  | "mcp.connect"
  | "mcp.call"
  | "mcp.list-tools"
  | "skill.activate"
  | "skill.load"
  | "replay.run"
  | "replay.skipped";
```

Defined in: [packages/observability/src/gen-ai/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L51)

Canonical `gen_ai.operation.name` enum used per the OpenTelemetry
GenAI semantic conventions for AI agent + framework spans.

## Stable
