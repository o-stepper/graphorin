---
'@graphorin/agent': patch
'@graphorin/tools': patch
---

Make durable HITL exactly-once and gate approvals on validated input (agent-02, tools-02, agent-07). With a `checkpointStore` wired, the resume now persists a write-ahead intent checkpoint before dispatching approved calls and the journaled post-dispatch state after - so a re-delivered resume from the latest checkpoint (or from `result.state` in the manual JSON flow) cannot double-fire a side effect; re-resuming a stale pre-execution snapshot stays bounded at one re-execution. The executor validates (and repairs) args BEFORE the approval flow, evaluates `needsApproval` on the validated input, and the approval record carries the post-repair args a human actually vets; the agent pre-screen mirrors this (schema-invalid gated calls fail fast as `invalid_input`, never reaching a human) and the resumed dispatch runs with repair disabled so nothing can rewrite an approved payload behind the grant. Partial approval directives now execute the granted calls and re-suspend with the remainder instead of silently discarding grants. The FAQ and agent-runtime guide are rewritten to state the real exactly-once contract.
