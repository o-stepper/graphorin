---
'@graphorin/agent': patch
---

Documentation sync on the operator-facing HITL and usage surfaces (W-125): the agent-runtime guide now describes the real `tool.approval.requested` event shape (`{ type, toolCallId, reason? }`, with tool name and args read from `RunState.pendingApprovals`), the README names the real `RunState.usageByModel` field (was `RunState.usage.byModel`), and the `ResponseVerifier` TSDoc states what actually happens when a verifier throws (treated as passed; the `verifier.result` event still fires with `ok: true` - nothing is logged, since `AgentConfig` has no logger).
