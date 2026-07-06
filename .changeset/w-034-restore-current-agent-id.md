---
'@graphorin/agent': minor
---

`RunState.currentAgentId` is restored to the parent when a handoff child returns (W-034): the transfer is now scoped to the child observation window (restored in `finally`, on the failed branch too), so post-handoff `RunStep.agentId`, resume-step attribution and session JSONL exports identify the agent whose model actually drove the step. Consumers that relied on the id sticking to the handoff target will observe the corrected attribution; the child's identity remains durably recorded in `RunState.handoffs` and the `handoff` event.
