-- W-005 migration 029: link workflow checkpoints to their session so a
-- session hard-delete can cascade into the suspended-run snapshots.
--
-- HITL suspends persist the FULL serialized RunState (messages, steps,
-- handoffs) into workflow_checkpoints under threadId=runId, namespace
-- 'agent'. Without a session_id column those snapshots were unfindable
-- for the erasure path and survived DELETE /v1/sessions/:id forever.
-- The agent runtime now stamps metadata.sessionId on every suspend
-- write; this column persists it, and the backfill recovers it for
-- historical agent rows from the state blob (RunState.sessionId is a
-- required field of every schema version).

ALTER TABLE workflow_checkpoints ADD COLUMN session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_session
  ON workflow_checkpoints (session_id);

UPDATE workflow_checkpoints
   SET session_id = json_extract(state_json, '$.sessionId')
 WHERE namespace = 'agent' AND session_id IS NULL;
