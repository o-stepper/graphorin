[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / KnownSpanType

# Type Alias: KnownSpanType

```ts
type KnownSpanType = 
  | "agent.run"
  | "agent.step"
  | "agent.handoff"
  | "agent.suspend"
  | "agent.resume"
  | "provider.generate"
  | "provider.stream"
  | "tool.execute"
  | "tool.approval"
  | "memory.read.working"
  | "memory.read.session"
  | "memory.read.episodic"
  | "memory.read.semantic"
  | "memory.read.procedural"
  | "memory.read.shared"
  | "memory.write.working"
  | "memory.write.session"
  | "memory.write.episodic"
  | "memory.write.semantic"
  | "memory.write.procedural"
  | "memory.write.shared"
  | "memory.search.working"
  | "memory.search.session"
  | "memory.search.episodic"
  | "memory.search.semantic"
  | "memory.search.procedural"
  | "memory.search.shared"
  | "memory.consolidate.light"
  | "memory.consolidate.standard"
  | "memory.consolidate.deep"
  | "memory.consolidate.reflect"
  | "memory.consolidate.learned-context"
  | "memory.consolidate.curated-block"
  | "memory.consolidate.profile-projection"
  | "memory.consolidate.promotion"
  | "memory.search.insight"
  | "memory.read.insight"
  | "memory.write.insight"
  | "memory.conflict"
  | "memory.embed"
  | "workflow.run"
  | "workflow.step"
  | "workflow.task"
  | "workflow.checkpoint"
  | "skill.activate"
  | "skill.load"
  | "mcp.connect"
  | "mcp.call"
  | "mcp.list-tools";
```

Defined in: packages/core/src/contracts/tracer.ts:11

**`Stable`**

Framework-known discriminators for typed observability spans.

The list mirrors the span taxonomy documented for the observability
layer; concrete implementations live in `@graphorin/observability`.
Promoting a frequently-used custom span kind (see
[CustomSpanType](/api/@graphorin/core/type-aliases/CustomSpanType.md)) into this union is an additive minor change.
