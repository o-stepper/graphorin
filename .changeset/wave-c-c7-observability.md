---
'@graphorin/agent': minor
'@graphorin/provider': minor
'@graphorin/tools': minor
'@graphorin/core': minor
---

Trace-tree observability (audit 2026-07-04 Wave C, cluster C7; pairs periphery-04).

The agent loop now emits the previously-declared `agent.run` span per run and `agent.step` spans per step (parented under the run); `tool.execute` parents under the current step via the new optional `RunContext.span`; a `withTracing`-wrapped provider parents under the step via the new `ProviderRequest.parentSpan` (a live handle like `signal`). Attributes align to the OTel GenAI semantic conventions (`gen_ai.operation.name`, `gen_ai.agent.id/name`, `gen_ai.tool.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens/output_tokens`), parent-based sampling finally has parents to follow, and observability.md documents the real tree plus the memory-tier-spans-not-yet-parented limitation.
