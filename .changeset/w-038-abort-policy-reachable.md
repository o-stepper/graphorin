---
'@graphorin/agent': minor
---

The `onPendingApprovals` abort policy is now reachable and safe (W-038). An abort that races the durable-HITL suspend applies the policy to the just-collected approvals instead of parking them behind a stale `awaiting_approval` checkpoint; the last persisted checkpoint always reflects the final, policy-consistent state. `'deny'` now commits a tool message per drained approval so the transcript keeps no dangling `tool_use`; `'hold'` survives on the aborted state (bare `run(state)` stays parked, an explicit directive resumes); `'fail'` fails the run ONLY when approvals are actually pending - aborting with an empty queue ends `'aborted'`, never `'failed'` (this matches the documented contract; consumers relying on the old unconditional `failed` will observe `aborted`). The guide now attributes the 50 ms grace to the tools executor's `cancellationGraceMs`, where it lives.
