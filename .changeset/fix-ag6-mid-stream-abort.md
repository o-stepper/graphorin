---
'@graphorin/agent': patch
---

fix(agent): a mid-stream abort ends the run as 'aborted', not a failed run; implement `drain` (AG-6)

An abort that landed while the provider was streaming threw the `run-aborted`
sentinel, which the catch flattened to a `kind:'unknown'` provider error and
broke out of the fallback chain — landing in the "no model completed" path. The
run finished `'failed'` with code `'no-provider-completed'`, never emitting
`agent.cancelling` and bypassing the `onPendingApprovals` policy. Since the
streaming window dominates a run's wall-clock, this was the *typical* abort
outcome.

The loop-top cancellation is now a shared `emitCancellation` path that the
mid-stream abort also routes through: a mid-stream abort surfaces
`agent.cancelling`, applies `onPendingApprovals`, and ends the run `'aborted'`
(or `'failed'` under the `'fail'` policy). The fallback chain no longer continues
against an already-aborted signal.

`drain` is now implemented (it was previously only echoed in the event): the
default hard-kills the in-flight stream mid-event, while `abort({ drain: true })`
lets the current step's stream reach its boundary before stopping. The
`AbortOptions` JSDoc and the README's stale "50 ms grace" claim are corrected.
