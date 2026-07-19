[**Graphorin API reference v0.13.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [errors](/api/@graphorin/agent/errors/index.md) / AgentRuntimeErrorCode

# Type Alias: AgentRuntimeErrorCode

```ts
type AgentRuntimeErrorCode = 
  | "invalid-config"
  | "invalid-preferred-model"
  | "invalid-fallback-policy"
  | "invalid-evaluator-optimizer-config"
  | "agent-resolution-failed"
  | "tool-not-found"
  | "handoff-target-not-found"
  | "multiple-handoffs-in-step"
  | "sub-run-resume-target-not-found"
  | "run-aborted"
  | "middleware-order-violation"
  | "progress-write-failed"
  | "merge-blocked"
  | "protocol-injection-rejected"
  | "run-state-version-unsupported"
  | "run-state-malformed"
  | "concurrent-run"
  | "budget-exceeded"
  | "budget-unpriced";
```

Defined in: packages/agent/src/errors/index.ts:16

**`Stable`**

Stable code discriminator surfaced on every [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md).
