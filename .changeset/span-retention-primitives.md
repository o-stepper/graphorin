---
'@graphorin/store-sqlite': minor
---

W-006/W-008: span retention primitives. New exported `deleteSpansForSession(conn, sessionId)` and `pruneSpans(conn, {beforeEpochMs})` (deletes spans that FINISHED before the cutoff, epoch-ms in, ns conversion inside; covers `session_id IS NULL` rows whose only deletion path is age). Migration 030 adds the `idx_spans_end` index so the sweep is not a full table scan. Session hard-delete already cascades into `spans` via the `SESSION_SCOPED_PURGES` registry - `session.replay()` for a deleted session no longer reconstructs the run, which is the point of hard-delete. `documentation/guide/observability.md` now tells the real retention story (`graphorin traces prune` / `pruneSpans`) instead of claiming a nonexistent "configured retention window".
