---
'@graphorin/agent': patch
'@graphorin/tools': patch
'@graphorin/memory': patch
---

Enforce transcript well-formedness so no path emits provider-rejected message sequences (agent-01, tools-07, context-engine-01). The durable-HITL pre-screen now collects EVERY approval-gated call in a step (not just the first) and executes the non-gated remainder before suspending, so the persisted transcript never carries dangling `tool_use` ids; `executeBatch` synthesizes an `execution_failed` outcome instead of silently dropping a slot whose `executeOne` rejected (e.g. a throwing tracer); summarize-compaction snaps its boundary backward so the preserved window never starts with an orphan `tool` message. The agent mock-provider harness now asserts transcript well-formedness on every request by default.
