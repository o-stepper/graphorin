---
'@graphorin/core': minor
'@graphorin/agent': patch
---

W-049: `tool.execute.start` / `tool.execute.end` / `tool.execute.error` events now carry an optional `toolName` (the agent runtime always fills it, on every emit path: batch dispatch, handoff, inline sub-agent, approval pre-screen and resumed dispatch). Direct stream subscribers can render the tool name from any lifecycle event without a stateful join back to `tool.call.start`. The union TSDoc now states the correlation policy explicitly: cross-run attribution belongs to the server envelope (`subject`), in-lifecycle correlation is by `toolCallId`, and `runId` is deliberately NOT retrofitted onto every variant. Additive and wire-compatible (the wire projection spreads unknown fields through); old consumers keep working.
