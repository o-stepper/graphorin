---
'@graphorin/agent': minor
---

W-025/W-100: export `HandoffEntry` from the package root - it is the public type of `AgentConfig.handoffs` and was previously only reachable via type inference, forcing `as unknown as Agent<TDeps, unknown>` casts in consumers that wanted a typed handoff list.
