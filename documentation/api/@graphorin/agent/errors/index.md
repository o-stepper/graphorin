[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / errors

# errors

Typed error surface for `@graphorin/agent`.

Every error class extends the base [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md) which is
a thin wrapper around `Error` with a stable `code` discriminator so
callers can `switch` on it without parsing messages.

## Classes

| Class | Description |
| ------ | ------ |
| [AgentResolutionError](/api/@graphorin/agent/errors/classes/AgentResolutionError.md) | Thrown by `runStateFromJSON(...)` when the agent name in the serialized state cannot be resolved against the supplied agent graph (renamed agent / removed handoff). |
| [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md) | Base class for every error thrown from `@graphorin/agent`. |
| [ConcurrentRunError](/api/@graphorin/agent/errors/classes/ConcurrentRunError.md) | Thrown when a second `run()` / `stream()` starts while another run is in flight on the same `Agent` instance (AG-11). The public surface (`steer` / `followUp` / `abort` / `compact`) addresses "the run" without a run handle, so overlapping runs would share the abort controller, steer queue, and executor bridge - start the second run on its own `createAgent(...)` instance instead. |
| [EvaluatorOptimizerConfigError](/api/@graphorin/agent/errors/classes/EvaluatorOptimizerConfigError.md) | Thrown by `evaluatorOptimizer({...})` when `maxIterations < 1` at construction time. The helper purposely surfaces the misuse early rather than failing on the first run. |
| [InvalidAgentConfigError](/api/@graphorin/agent/errors/classes/InvalidAgentConfigError.md) | Thrown by `createAgent({...})` when the supplied options fail structural validation (missing `provider`, empty `name`, an `outputType` of kind `'text'` carrying a `schema`, ...). |
| [InvalidPreferredModelError](/api/@graphorin/agent/errors/classes/InvalidPreferredModelError.md) | Thrown by `createAgent({...})` when `preferredModel` carries an unknown literal (any value outside the `'fast' | 'balanced' | 'smart'` cost-tier vocabulary AND not a valid `ModelSpec`). |
| [MergeBlockedError](/api/@graphorin/agent/errors/classes/MergeBlockedError.md) | Thrown by `Agent.fanOut(...)` when the configured `MergeAgentSidewaysInjectionGuard` fires with strictness `'detect-and-block'`. |
| [MultipleHandoffsInStepError](/api/@graphorin/agent/errors/classes/MultipleHandoffsInStepError.md) | Base class for every error thrown from `@graphorin/agent`. |
| [ProgressWriteError](/api/@graphorin/agent/errors/classes/ProgressWriteError.md) | Thrown by `agent.progress.write(...)` when the atomic write fails (disk full, permission denied, ...). The partial `.tmp` file is unlinked before the error propagates. |
| [ProtocolInjectionRejectError](/api/@graphorin/agent/errors/classes/ProtocolInjectionRejectError.md) | Thrown by the protocol-injection guard when the operator selected the strictest deployment posture (`escapePolicy: 'reject'`) and a tool result body carries control characters at the corresponding outbound boundary. |
| [ProviderMiddlewareOrderError](/api/@graphorin/agent/errors/classes/ProviderMiddlewareOrderError.md) | Thrown by `createAgent({...})` when the supplied `composeProviderMiddleware` chain violates the canonical inside-out ordering (DEC-145 / ADR-039). |
| [RunStateMalformedError](/api/@graphorin/agent/errors/classes/RunStateMalformedError.md) | Thrown by `runStateFromJSON(...)` when the supplied JSON does not shape-match the documented `SerializedRunState`. |
| [RunStateVersionUnsupportedError](/api/@graphorin/agent/errors/classes/RunStateVersionUnsupportedError.md) | Thrown by `runStateFromJSON(...)` when the version field in the serialized state is from a future major version of the framework. |
| [SubAgentResumeTargetNotFoundError](/api/@graphorin/agent/errors/classes/SubAgentResumeTargetNotFoundError.md) | Thrown when a resume directive routes a decision into a parked sub-agent run (W-001) but the resuming agent instance cannot resolve the target: the parked toolName matches neither a configured handoff target nor a `toTool` sub-agent tool. Resume a parked sub-run on the SAME parent instance (or an identically-configured one). |
| [ToolNotFoundError](/api/@graphorin/agent/errors/classes/ToolNotFoundError.md) | Thrown by the agent loop when the model emits a tool call referring to an unregistered tool (the model hallucinated a name). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AgentRuntimeErrorCode](/api/@graphorin/agent/errors/type-aliases/AgentRuntimeErrorCode.md) | Stable code discriminator surfaced on every [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md). |
