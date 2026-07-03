[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / filters

# filters

Handoff filter library — a small set of pure, composable functions
that take the parent agent's message history and return a filtered
subset suitable for forwarding to a child agent.

Every filter pairs a `HandoffFilter` runtime function with a
serializable [HandoffInputFilterDescriptor](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) so the JSONL
session export (`@graphorin/sessions`) can replay the filter stack
even after the runtime implementations evolve.

Reasoning content is **always** stripped at the handoff boundary —
`filters.compose(...)` guarantees `stripReasoning()` runs last so a
caller-supplied filter cannot accidentally forward reasoning to a
child agent. This is the confidentiality + token-economy default
documented in the agent-loop reference.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [DescribedFilter](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | A `HandoffFilter` paired with the serializable descriptor that round-trips through the JSONL session export. Authors of custom filters return one of these via `filters.custom({...})`. |

## Variables

| Variable | Description |
| ------ | ------ |
| [FILTER\_KIND\_CUSTOM](/api/@graphorin/agent/filters/variables/FILTER_KIND_CUSTOM.md) | Pure `HandoffInputFilterDescriptor` for callers that just need the descriptor without instantiating the runtime function (e.g. the sessions package's lenient-forward-parse path). |
| [filters](/api/@graphorin/agent/filters/variables/filters.md) | Aggregate module export. |

## Functions

| Function | Description |
| ------ | ------ |
| [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) | Drop messages whose effective sensitivity ceiling exceeds `maxTier`. Messages without sensitivity metadata default to `'public'` and are always kept. |
| [compose](/api/@graphorin/agent/filters/functions/compose.md) | Compose multiple filters left-to-right. The composer **always** appends `stripReasoning()` at the end so reasoning content never crosses a handoff boundary regardless of caller intent. |
| [custom](/api/@graphorin/agent/filters/functions/custom.md) | Wrap a caller-supplied function as a [DescribedFilter](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) with the canonical `'custom'` descriptor. |
| [defaultHandoffFilter](/api/@graphorin/agent/filters/functions/defaultHandoffFilter.md) | The canonical default applied by the agent runtime to every `Agent.toTool(...)` and `handoff(...)` invocation when the caller does not supply an explicit filter. |
| [full](/api/@graphorin/agent/filters/functions/full.md) | The full unfiltered history. Discouraged — security-conscious callers should pick [lastN](/api/@graphorin/agent/filters/functions/lastN.md) or [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) instead (a sub-agent rarely needs the parent's entire conversation). |
| [lastN](/api/@graphorin/agent/filters/functions/lastN.md) | Keep the parent's system prompt and the last `n` non-system messages. Default `n = 10` per DEC-146 / RB-40 security-first compose. |
| [lastUser](/api/@graphorin/agent/filters/functions/lastUser.md) | Keep only the parent's system prompt and the most recent user message. Useful for simple sub-agents that only need the question. |
| [stripReasoning](/api/@graphorin/agent/filters/functions/stripReasoning.md) | Strip every `ReasoningContent` part from each message. Always applied at the handoff boundary (the `compose(...)` helper appends this filter automatically). |
| [stripSensitiveOutputs](/api/@graphorin/agent/filters/functions/stripSensitiveOutputs.md) | Strip tool messages whose `content` carries the literal token `[REDACTED:secret]` or whose `secret` annotation marks the body as sensitive. Conservative-by-design: the agent runtime tags sensitive tool outputs at session-write time so this filter has stable bytes to scan against. |
| [stripToolCalls](/api/@graphorin/agent/filters/functions/stripToolCalls.md) | Drop every assistant `toolCalls` array AND every `tool` message. Useful when a sub-agent should only see the textual conversation. |
| [summary](/api/@graphorin/agent/filters/functions/summary.md) | Replace the parent's history with a single system message carrying the supplied summary. Used by callers that wire in an LLM-based summarizer outside the framework. |
