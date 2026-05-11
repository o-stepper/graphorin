-- Phase 10b migration 012: extend `conflict_check_pending` (introduced
-- by migration 010) with the JSON-encoded list of existing fact ids
-- that the multi-stage conflict resolution pipeline (DEC-117 / ADR-018
-- ext / RB-02) wants the consolidator's deep phase to evaluate
-- alongside the deferred candidate.
--
-- Phase 10b only enqueues; Phase 10c drains the queue, runs the LLM
-- judge against (`candidate_text`, conflicting_ids_json[*]), and writes
-- the resolution back via `markResolved(...)`.

ALTER TABLE conflict_check_pending
  ADD COLUMN conflicting_ids_json TEXT;
