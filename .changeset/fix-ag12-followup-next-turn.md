---
'@graphorin/agent': patch
---

fix(agent): followUp() is honest next-turn metadata (AG-12)

A `followUp()` queued during a run used to flip the finished run back to
`status: 'running'`, delete `finishedAt`, and append the message to a loop
placeholder that never processed it — persisting a non-terminal RunState
with a dangling unprocessed user message.

The run now always ends with its real terminal status, and the queued
message rides into the NEXT fresh `run()` / `stream()` as a leading user
turn (before that call's own input) — matching the documented "next-turn
metadata" semantics. Resumed runs leave the queue intact. The dead
`runFollowUpLoop` placeholder is removed.
