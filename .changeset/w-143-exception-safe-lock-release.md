---
'@graphorin/memory': patch
---

Consolidator completion accounting is now exception-safe (W-143): a transient storage error (for example SQLITE_BUSY) in `recordRunFinish`, `upsertState`, or the failure path's `enqueueFailedBatch` no longer escapes `#runPhase` after the phase's work is committed - previously it left the scope lock held until staleness takeover (5-15 minutes by tier), the `consolidator_runs` row forever unfinished, and every trigger of the window deferred. Each accounting step is best-effort with the swallowed error surfaced on a dedicated `x.memory.consolidator.accounting` error span; the lock release runs in a `finally` with its own guard so a release failure cannot mask the accounting one.
