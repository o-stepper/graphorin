---
'@graphorin/agent': patch
---

fix(agent): don't re-run / silently complete a resumed suspended-or-failed run (AG-14)

Resuming a `RunState` without a directive that resolves its pending approvals
walked straight back into the provider loop: an `awaiting_approval` run re-issued
an assistant message carrying a `tool_use` with no matching tool result (which
real providers reject), and a `'failed'` run was silently rewritten to
`'completed'` — corrupting the terminal status of a run that never succeeded.

A resumed run that is still suspended (`awaiting_approval` with approvals the
directive did not resolve) or already `'failed'` now returns as-is without a
provider call, and the `failed → completed` rewrite is gone. The granted-directive
path is unchanged (all approvals resolved → status `'running'` → the loop
resumes). Tests cover both: a no-directive `awaiting_approval` resume emits no
`step.start`, and a resumed `failed` run is not re-entered.
