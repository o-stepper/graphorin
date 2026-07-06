---
'@graphorin/memory': patch
---

W-142: the consolidator's failed-slice capture (MCON-10) is now keyed per scope. `#lastDispatchMessageIds` was a single instance field while the consolidation lock is per-scope, so two scopes running standard phases concurrently in one process could cross-contaminate: scope B's dispatch overwrote the field and scope A's DLQ row then recorded B's messageIds. The capture is now a `Map` keyed by the same scope key the lock uses (exported as `scopeKey` from the lock module), written by the dispatching scope only and cleared in a `finally` so entries never outlive their dispatch. Replays were unaffected (they re-read from the cursor); this fixes the "which slice failed" audit metadata.
