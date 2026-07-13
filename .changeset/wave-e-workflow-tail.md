---
'@graphorin/workflow': minor
'@graphorin/server': minor
'@graphorin/cli': minor
---

Workflow durability tail (wave-E E2, plan item 16). `fork(threadId, fromCheckpointId, { patch })` merges channel-level values into the forked root's state ("branch here, but with these corrected values"): patch keys must name declared channels and the merged state re-runs the WF-10 JSON-safety guard; over HTTP the same patch is the optional `state` field of `POST /v1/workflows/:id/fork`. New read-only inspection helpers `readThreadState(store, workflowName, threadId)` / `listThreadCheckpoints(...)` decode a thread's latest checkpoint (status, unwrapped channel state, the full pending-pause frontier) and its timeline off a bare `CheckpointStore` by workflow NAME - and back the new operator commands `graphorin workflow inspect <threadId> --workflow <name>` and `graphorin workflow checkpoints <threadId> --workflow <name>` (read-only, exit 1 on unknown thread). The cross-process durability invariant is now pinned end-to-end: a thread suspended on an approval in a SIGKILLed process resumes from SQLite in a fresh one. `multiResume` intentionally not built (decision D-2).
