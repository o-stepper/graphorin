---
'@graphorin/core': minor
'@graphorin/agent': minor
---

Sub-agent transparency (W-036). New additive `AgentEvent` member `subagent.event` wraps a child's event (with the parent-side toolCallId and the child agent name) and forwards it into the parent stream per the `forwardEvents` policy on handoff entries and `AgentToToolOptions`: `'lifecycle'` (default) forwards tool execution/approval, guardrail, lateral-leak, compaction and error events - never text deltas; `'all'` forwards everything; `'none'` keeps the child a black box. Multi-agent runs now form ONE trace tree: `AgentCallOptions.parentSpan` (not persisted in RunState) parents the run span, and the runtime supplies it automatically for handoffs and `toTool` children from the live step span. The wire codec projects the wrapped event recursively. TypeScript consumers with exhaustive switches over `AgentEvent` must add the new case.
