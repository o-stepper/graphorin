---
'@graphorin/workflow': minor
'@graphorin/server': minor
'@graphorin/agent': minor
---

Reachable per-thread checkpoint erasure (W-005) - `CheckpointStore.deleteThread` finally has supported callers:

- `@graphorin/workflow`: the workflow handle gains `deleteThread(threadId)` next to `listCheckpoints` (idempotent; deletes every checkpoint + pending write of the thread).
- `@graphorin/server`: new route `DELETE /v1/workflows/:id/threads/:threadId` under scope `workflows:delete:<id>` (204 on success, 404 for an unknown workflow, 400 when the registered entry does not expose `deleteThread`); `ServerWorkflowLike` gains the optional `deleteThread?` member.
- `@graphorin/agent`: opt-in `AgentConfig.checkpointPolicy: 'keep' | 'delete-on-terminal'` (default `'keep'` - byte-identical to today). With `'delete-on-terminal'` the run's checkpoint thread is best-effort deleted after `completed`/`failed` runs, mirroring the TL-10 spill lifecycle; `awaiting_approval` and `aborted` runs always keep theirs (the thread is the resume state).

Full erasure cascades stay the job of the session purge path; these are the operator levers for hygiene and targeted per-thread GDPR requests.
