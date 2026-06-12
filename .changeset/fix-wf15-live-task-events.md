---
'@graphorin/workflow': patch
---

fix(workflow): 'tasks'/'custom' stream modes are live, not batched (WF-15)

`workflow.task.start` / `workflow.task.end` / `ctx.emit` custom events were
buffered per step and flushed only after ALL parallel tasks settled — a
60-second node's `task.start` arrived together with its `task.end`, making
the granular stream modes useless for progress display. The step loop now
pumps the event queues live while tasks run (pushes wake the pump; settle
closes it), so a long node's start — and any custom progress events it
emits — are observable while it is still running.
