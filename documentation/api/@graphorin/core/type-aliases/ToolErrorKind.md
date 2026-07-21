[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolErrorKind

# Type Alias: ToolErrorKind

```ts
type ToolErrorKind = 
  | "approval_denied"
  | "sandbox_violation"
  | "timeout"
  | "invalid_input"
  | "invalid_output"
  | "execution_failed"
  | "unknown_tool"
  | "aborted"
  | "inbound_sanitization_blocked"
  | "dataflow_policy_blocked"
  | "capability_blocked"
  | "rate_limited";
```

Defined in: packages/core/src/types/tool.ts:225

**`Stable`**

Discriminator used by `ToolError.kind`. The list is exhaustive: any new
kind must extend the union here and every `assertNever` switch.
