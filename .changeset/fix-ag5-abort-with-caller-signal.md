---
'@graphorin/agent': patch
---

fix(agent): `agent.abort()` now works when the caller passed `options.signal` (AG-5)

The run loop and every provider request observed `options.signal ?? localCtl.signal`,
so when a caller supplied their own `signal`, `agent.abort()` — which aborts the
*local* controller — was a silent no-op: the loop never saw the abort, the run
ran to completion, and `abort({ onPendingApprovals: 'deny' })` never denied
anything. The parent→local listener was also never removed, accumulating on
long-lived shared signals.

The loop now always observes `localCtl.signal`; the caller's `options.signal` is
propagated into it by a listener (also firing for an already-aborted parent),
and that listener is torn down in the run's `finally` so it does not accumulate
across runs sharing one signal. Tests cover both: abort mid-run with a
caller-supplied signal stops the run and applies `onPendingApprovals`, and the
listener count stays balanced across repeated runs.
