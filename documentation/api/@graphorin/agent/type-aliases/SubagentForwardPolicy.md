[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / SubagentForwardPolicy

# Type Alias: SubagentForwardPolicy

```ts
type SubagentForwardPolicy = "none" | "lifecycle" | "all";
```

Defined in: packages/agent/src/types.ts:167

**`Stable`**

Sub-agent event-forwarding policy. `'lifecycle'` (default)
forwards tool execution/approval, guardrail, lateral-leak,
compaction and error events - never the high-frequency text deltas;
`'all'` forwards everything; `'none'` keeps the child a black box.
