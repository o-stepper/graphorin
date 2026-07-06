[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / ToolAuditAction

# Type Alias: ToolAuditAction

```ts
type ToolAuditAction = 
  | "tool:registered"
  | "tool:classification:warn"
  | "tool:examples:overflow"
  | "tool:result:cap-disabled"
  | "tool:execute:start"
  | "tool:execute:end"
  | "tool:execute:error"
  | "tool:execute:streamed"
  | "tool:approval:requested"
  | "tool:approval:granted"
  | "tool:approval:denied"
  | "tool:result:truncated"
  | "tool:result:spill:written"
  | "tool:result:sanitization:hit"
  | "tool:result:sanitization:blocked"
  | "tool:dataflow:flagged"
  | "tool:dataflow:blocked"
  | "tool:dataflow:declassified"
  | "tool:retrieval:deferred"
  | "tool:retrieval:search:executed"
  | "tool:collision:detected"
  | "tool:collision:priority-resolved"
  | "tool:collision:auto-prefix-applied"
  | "tool:collision:manual-rejected"
  | "tool:collision:suppressed";
```

Defined in: [packages/tools/src/audit/index.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L52)

Discriminator for the audit-event family emitted by the tools
subsystem.

## Stable
