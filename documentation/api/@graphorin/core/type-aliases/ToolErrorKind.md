[**Graphorin API reference v0.1.0**](../../../index.md)

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
  | "rate_limited";
```

Defined in: packages/core/src/types/tool.ts:180

Discriminator used by `ToolError.kind`. The list is exhaustive: any new
kind must extend the union here and every `assertNever` switch.

## Stable
