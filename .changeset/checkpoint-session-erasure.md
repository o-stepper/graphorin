---
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/agent': minor
---

W-005: HITL/workflow checkpoints are linked to their session and erased by the session hard-delete cascade.

HITL suspends persist the FULL serialized conversation (`RunState`) into `workflow_checkpoints`; previously nothing connected those rows to a session, so `DELETE /v1/sessions/:id` left the entire transcript recoverable forever. Now: `CheckpointMetadata` gains an optional `sessionId` (additive); migration 029 adds a `session_id` column + index to `workflow_checkpoints` and backfills historical `namespace='agent'` rows from the state blob; the agent runtime stamps `sessionId` on all three suspend write sites (step suspend, resume write-ahead intent, post-dispatch journal); and `deleteSession`/`pruneSessions` collect thread ids from BOTH `session_workflow_runs` and the new column, erasing `workflow_checkpoints` + `workflow_pending_writes` before dropping the mapping. Deleting a session now removes its suspended-run snapshots - time-travel/forensics for a deleted session is intentionally gone (that is what hard-delete means).
