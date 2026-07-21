[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / filters

# filters

Handoff filter library - a small set of pure, composable functions
that take the parent agent's message history and return a filtered
subset suitable for forwarding to a child agent.

Every filter pairs a `HandoffFilter` runtime function with a
serializable [HandoffInputFilterDescriptor](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) so the JSONL
session export (`@graphorin/sessions`) can replay the filter stack
even after the runtime implementations evolve.

Reasoning content is **always** stripped at the handoff boundary -
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
| [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) | Drop messages that carry the literal `[REDACTED:secret]` redaction token when `maxTier` sits below `'secret'`. |
| [compose](/api/@graphorin/agent/filters/functions/compose.md) | Compose multiple filters left-to-right. The composer **always** appends `stripReasoning()` at the end so reasoning content never crosses a handoff boundary regardless of caller intent. |
| [custom](/api/@graphorin/agent/filters/functions/custom.md) | Wrap a caller-supplied function as a [DescribedFilter](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) with the canonical `'custom'` descriptor. |
| [defaultHandoffFilter](/api/@graphorin/agent/filters/functions/defaultHandoffFilter.md) | The canonical default applied by the agent runtime to every `Agent.toTool(...)` and `handoff(...)` invocation when the caller does not supply an explicit filter. |
| [full](/api/@graphorin/agent/filters/functions/full.md) | The full unfiltered history. Discouraged - security-conscious callers should pick [lastN](/api/@graphorin/agent/filters/functions/lastN.md) or [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md) instead (a sub-agent rarely needs the parent's entire conversation). |
| [lastN](/api/@graphorin/agent/filters/functions/lastN.md) | Keep the parent's system prompt and the last `n` non-system messages. Default `n = 10` per the DEC-146 security-first compose. |
| [lastUser](/api/@graphorin/agent/filters/functions/lastUser.md) | Keep only the parent's system prompt and the most recent user message. Useful for simple sub-agents that only need the question. |
| [stripReasoning](/api/@graphorin/agent/filters/functions/stripReasoning.md) | Strip every `ReasoningContent` part from each message. Always applied at the handoff boundary (the `compose(...)` helper appends this filter automatically). |
| [stripSensitiveOutputs](/api/@graphorin/agent/filters/functions/stripSensitiveOutputs.md) | Strip tool messages whose `content` carries a literal `[REDACTED:` redaction token - ANY redaction tier trips it, not only `secret`. There is no `secret` annotation on the message surface in the current slice; the token stamped by the redaction layer at session-write time is the only signal this filter scans, so an output that was never redaction-stamped passes through. Same weak-contract caveat as [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md). |
| [stripToolCalls](/api/@graphorin/agent/filters/functions/stripToolCalls.md) | Drop every assistant `toolCalls` array AND every `tool` message. Useful when a sub-agent should only see the textual conversation. |
| [summary](/api/@graphorin/agent/filters/functions/summary.md) | Replace the parent's history with a single system message carrying the supplied summary. Used by callers that wire in an LLM-based summarizer outside the framework. |
