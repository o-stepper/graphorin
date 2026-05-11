[**Graphorin API reference v0.1.0**](../../../index.md)

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
| [AgentResolutionError](/api/@graphorin/agent/errors/classes/AgentResolutionError.md) | Thrown by `RunState.fromJSON(...)` when the agent name in the serialized state cannot be resolved against the supplied agent graph (renamed agent / removed handoff). |
| [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md) | Base class for every error thrown from `@graphorin/agent`. |
| [EvaluatorOptimizerConfigError](/api/@graphorin/agent/errors/classes/EvaluatorOptimizerConfigError.md) | Thrown by `evaluatorOptimizer({...})` when `maxIterations < 1` at construction time. The helper purposely surfaces the misuse early rather than failing on the first run. |
| [InvalidAgentConfigError](/api/@graphorin/agent/errors/classes/InvalidAgentConfigError.md) | Thrown by `createAgent({...})` when the supplied options fail structural validation (missing `provider`, empty `name`, both `outputType: 'text'` and `outputSchema` declared, ...). |
| [InvalidPreferredModelError](/api/@graphorin/agent/errors/classes/InvalidPreferredModelError.md) | Thrown by `createAgent({...})` when `preferredModel` carries an unknown literal (any value outside the `'fast' | 'balanced' | 'smart'` cost-tier vocabulary AND not a valid `ModelSpec`). |
| [MergeBlockedError](/api/@graphorin/agent/errors/classes/MergeBlockedError.md) | Thrown by `Agent.fanOut(...)` when the configured MergeAgentSidewaysInjectionGuard fires with strictness `'detect-and-block'`. |
| [MultipleHandoffsInStepError](/api/@graphorin/agent/errors/classes/MultipleHandoffsInStepError.md) | Thrown when the model invokes more than one handoff (`transfer_to_*`) tool in a single response. Per the agent-loop documentation this is an error rather than a silent drop. |
| [ProgressWriteError](/api/@graphorin/agent/errors/classes/ProgressWriteError.md) | Thrown by `agent.progress.write(...)` when the atomic write fails (disk full, permission denied, ...). The partial `.tmp` file is unlinked before the error propagates. |
| [ProtocolInjectionRejectError](/api/@graphorin/agent/errors/classes/ProtocolInjectionRejectError.md) | Thrown by the protocol-injection guard when the operator selected the strictest deployment posture (`escapePolicy: 'reject'`) and a tool result body carries control characters at the corresponding outbound boundary. |
| [ProviderMiddlewareOrderError](/api/@graphorin/agent/errors/classes/ProviderMiddlewareOrderError.md) | Thrown by `createAgent({...})` when the supplied `composeProviderMiddleware` chain violates the canonical inside-out ordering (DEC-145 / ADR-039). |
| [RunStateMalformedError](/api/@graphorin/agent/errors/classes/RunStateMalformedError.md) | Thrown by `RunState.fromJSON(...)` when the supplied JSON does not shape-match the documented SerializedRunState. |
| [RunStateVersionUnsupportedError](/api/@graphorin/agent/errors/classes/RunStateVersionUnsupportedError.md) | Thrown by `RunState.fromJSON(...)` when the version field in the serialized state is from a future major version of the framework. |
| [ToolNotFoundError](/api/@graphorin/agent/errors/classes/ToolNotFoundError.md) | Thrown by the agent loop when the model emits a tool call referring to an unregistered tool (the model hallucinated a name). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AgentRuntimeErrorCode](/api/@graphorin/agent/errors/type-aliases/AgentRuntimeErrorCode.md) | Stable code discriminator surfaced on every [AgentRuntimeError](/api/@graphorin/agent/errors/classes/AgentRuntimeError.md). |
